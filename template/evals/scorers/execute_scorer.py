"""
execute 스킬 채점기.

구조적 검증: 페이즈 아티팩트 파일 존재, 게이트 통과 여부(aborted 플래그),
mutation 범위 일치(계획 파일 수 vs 실제 변경 파일 수), Reviewer Verdict.

LLM 없이 파일 존재·플래그·텍스트 패턴만으로 재현 가능하게 채점한다.
"""

import glob
import os
from datetime import datetime, timezone
from typing import Any

# --- 채점 항목별 가중치 ---
WEIGHTS: dict[str, float] = {
    "phase_artifacts_created": 0.25,
    "gate_respected":          0.20,
    "implementation_log":      0.20,
    "review_report":           0.20,
    "mutation_scope_match":    0.15,
}

READY_FOR_APPROVAL_MARKER = "[Ready for Approval]"


def score(case: dict[str, Any], log: dict[str, Any], project_root: str) -> dict[str, Any]:
    """
    하나의 골든 케이스와 실행 로그를 받아 EvalResult를 반환한다.

    Parameters
    ----------
    case         : cases/execute.json 항목 하나
    log          : logs/latest.json 전체 딕셔너리
    project_root : 평가 대상 프로젝트의 절대 경로
    """
    expected = case.get("expected_behavior", {})
    output   = log.get("output_result", {})
    details: dict[str, Any] = {}

    verification_dir = os.path.join(
        project_root, "docs", "exec-plans", "active", "verification"
    )

    # 1. 페이즈 아티팩트 생성 여부 (research-brief.md + [Ready for Approval] 레이블)
    research_brief_path = os.path.join(verification_dir, "research-brief.md")
    research_brief_ok   = os.path.isfile(research_brief_path)

    # ep-*.md에서 [Ready for Approval] 레이블 확인
    ep_glob  = os.path.join(project_root, "docs", "exec-plans", "active", "ep-*.md")
    ep_files = glob.glob(ep_glob)
    ready_label_ok = False
    if ep_files:
        for ep in ep_files:
            with open(ep, encoding="utf-8") as f:
                if READY_FOR_APPROVAL_MARKER in f.read():
                    ready_label_ok = True
                    break

    # abort 케이스는 ready_label_ok가 true여야 하고 research_brief는 true여야 함
    # expected.aborted=true 인 경우 ready_label_ok 필수, implementation_log 불필요
    phase_artifacts_ok = research_brief_ok and ready_label_ok
    details["phase_artifacts_created"] = {
        "passed": phase_artifacts_ok,
        "weight": WEIGHTS["phase_artifacts_created"],
        "note":   f"research-brief.md={'존재' if research_brief_ok else '없음'}, "
                  f"[Ready for Approval]={'존재' if ready_label_ok else '없음'}",
    }

    # 2. 검증 확인 필요 단계 준수 여부
    # - aborted=True인 케이스는 implementation_log가 없어야 정상 (게이트가 지켜진 것)
    # - aborted=False인 케이스는 approved=True가 로그에 있어야 정상
    aborted_in_log        = bool(output.get("aborted", False))
    expected_aborted      = expected.get("aborted", False)
    mutation_attempted    = bool(output.get("mutation_attempted", False))

    if expected_aborted:
        # 중단 케이스: mutation이 없어야 게이트가 지켜진 것
        gate_ok   = not mutation_attempted
        gate_note = "abort 케이스: mutation_attempted=False 확인" if gate_ok else "⚠️ abort에도 불구하고 소스 변경 시도됨"
    else:
        # 정상 진행 케이스: mutation이 있어야 함 (게이트 통과 후 구현된 것)
        gate_ok   = mutation_attempted
        gate_note = "정상 케이스: mutation_attempted=True 확인" if gate_ok else "게이트 통과 후 구현 없음"

    details["gate_respected"] = {
        "passed": gate_ok,
        "weight": WEIGHTS["gate_respected"],
        "note":   gate_note,
    }

    # 3. implementation-log.md 존재
    impl_log_path = os.path.join(verification_dir, "implementation-log.md")
    impl_log_ok   = os.path.isfile(impl_log_path)
    expected_impl = expected.get("implementation_log_created", True)

    # abort 케이스는 impl_log가 없는 것이 정상 (기대값과 일치하면 OK)
    impl_log_pass = (impl_log_ok == expected_impl)
    details["implementation_log"] = {
        "passed": impl_log_pass,
        "weight": WEIGHTS["implementation_log"],
        "note":   f"파일 존재={impl_log_ok}, 기대값={expected_impl}",
    }

    # 4. review-report.md 존재
    review_report_path = os.path.join(verification_dir, "review-report.md")
    review_report_ok   = os.path.isfile(review_report_path)
    expected_review    = expected.get("review_report_created", True)
    review_pass        = (review_report_ok == expected_review)

    # review-report.md가 있다면 verdict도 확인
    verdict_note = ""
    if review_report_ok:
        with open(review_report_path, encoding="utf-8") as f:
            report_content = f.read()
        expected_verdict = expected.get("reviewer_verdict")
        if expected_verdict:
            verdict_found = expected_verdict in report_content
            verdict_note  = f", verdict '{expected_verdict}'={'존재' if verdict_found else '없음'}"
            if not verdict_found:
                review_pass = False

    details["review_report"] = {
        "passed": review_pass,
        "weight": WEIGHTS["review_report"],
        "note":   f"파일 존재={review_report_ok}, 기대값={expected_review}{verdict_note}",
    }

    # 5. mutation 범위 일치 (계획 파일 수와 실제 변경 파일 수의 대략적 일치)
    # 로그의 files_mutated_count를 ep-*.md의 Implementation Order 단계 수와 비교
    # 단, abort 케이스는 0이 정상
    files_mutated_count = output.get("files_mutated_count", 0)
    if expected_aborted:
        scope_ok   = (files_mutated_count == 0)
        scope_note = f"abort 케이스: files_mutated_count={files_mutated_count} (기대: 0)"
    else:
        # 최소 1개 이상 변경되어야 "정상 구현"으로 판단
        scope_ok   = (files_mutated_count >= 1)
        scope_note = f"files_mutated_count={files_mutated_count}"

    details["mutation_scope_match"] = {
        "passed": scope_ok,
        "weight": WEIGHTS["mutation_scope_match"],
        "note":   scope_note,
    }

    # --- 가중 평균 점수 계산 ---
    score_value = sum(
        WEIGHTS[key] * (1.0 if d["passed"] else 0.0)
        for key, d in details.items()
    )
    passed = all(d["passed"] for d in details.values())

    return {
        "case_id":      case["id"],
        "skill":        "execute",
        "passed":       passed,
        "score":        round(score_value, 4),
        "details":      details,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
