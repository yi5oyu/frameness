"""
deep-interview 스킬 채점기.

구조적 검증만 수행: 파일 존재 여부, 텍스트 패턴, 로그 플래그.
LLM 호출 없이 재현 가능한 결과를 보장한다.
"""

import glob
import json
import os
from datetime import datetime, timezone
from typing import Any

# --- 채점 항목별 가중치 ---
WEIGHTS: dict[str, float] = {
    "prd_file_exists":       0.20,
    "prd_sections_present":  0.25,
    "exec_plan_created":     0.20,
    "ambiguity_resolved":    0.20,
    "no_mutation":           0.15,
}

# PRD에 반드시 존재해야 할 기본 섹션 헤더
DEFAULT_REQUIRED_SECTIONS: list[str] = ["scope topology", "constraints", "acceptance criteria", "tech stack", "code style"]


def score(case: dict[str, Any], log: dict[str, Any], project_root: str) -> dict[str, Any]:
    """
    하나의 골든 케이스와 실행 로그를 받아 EvalResult를 반환한다.

    Parameters
    ----------
    case         : cases/deep-interview.json 항목 하나
    log          : logs/latest.json 전체 딕셔너리
    project_root : 평가 대상 프로젝트의 절대 경로 (파일 존재 확인용)
    """
    expected = case.get("expected_behavior", {})
    output   = log.get("output_result", {})
    details: dict[str, Any] = {}

    # 1. PRD 파일 존재 여부
    prd_path = os.path.join(project_root, "docs", "product-specs", "PRD.md")
    prd_exists = os.path.isfile(prd_path)
    details["prd_file_exists"] = {
        "passed": prd_exists,
        "weight": WEIGHTS["prd_file_exists"],
        "note": f"경로 확인: {prd_path}",
    }

    # 2. PRD 필수 섹션 존재
    required_sections = expected.get("prd_sections", DEFAULT_REQUIRED_SECTIONS)
    if prd_exists and required_sections:
        with open(prd_path, encoding="utf-8") as f:
            prd_content = f.read().lower()
        missing = [s for s in required_sections if s.lower() not in prd_content]
        sections_ok = len(missing) == 0
        details["prd_sections_present"] = {
            "passed": sections_ok,
            "weight": WEIGHTS["prd_sections_present"],
            "note": f"누락 섹션: {missing}" if missing else "모든 필수 섹션 확인됨",
        }
    else:
        # PRD 파일이 없으면 섹션 체크도 실패 처리
        details["prd_sections_present"] = {
            "passed": False,
            "weight": WEIGHTS["prd_sections_present"],
            "note": "PRD 파일 미존재로 섹션 검사 불가",
        }

    # 3. 실행 계획 파일 생성 여부
    exec_plan_glob = os.path.join(project_root, "docs", "exec-plans", "active", "ep-*.md")
    ep_files = glob.glob(exec_plan_glob)
    ep_created = len(ep_files) > 0
    details["exec_plan_created"] = {
        "passed": ep_created,
        "weight": WEIGHTS["exec_plan_created"],
        "note": f"발견된 ep 파일: {[os.path.basename(f) for f in ep_files]}",
    }

    # 4. 모호도 게이트 통과 여부 (로그 기반)
    ambiguity_resolved = bool(output.get("ambiguity_resolved", False))
    expected_resolved  = expected.get("ambiguity_resolved", True)
    # 조기 종료 케이스는 resolved=False가 정상 기대값이므로 일치 여부로 판단
    ambiguity_ok = ambiguity_resolved == expected_resolved
    details["ambiguity_resolved"] = {
        "passed": ambiguity_ok,
        "weight": WEIGHTS["ambiguity_resolved"],
        "note": f"로그값={ambiguity_resolved}, 기대값={expected_resolved}",
    }

    # 5. 소스 코드 mutation 시도 없음 (금지 확인)
    mutation_attempted = bool(output.get("mutation_attempted", False))
    no_mutation = not mutation_attempted
    details["no_mutation"] = {
        "passed": no_mutation,
        "weight": WEIGHTS["no_mutation"],
        "note": "소스 파일 직접 수정 없음" if no_mutation else "⚠️ 소스 파일 변경 시도 감지됨",
    }

    # --- 가중 평균 점수 계산 ---
    score_value = sum(
        WEIGHTS[key] * (1.0 if d["passed"] else 0.0)
        for key, d in details.items()
    )
    passed = all(d["passed"] for d in details.values())

    return {
        "case_id":      case["id"],
        "skill":        "deep-interview",
        "passed":       passed,
        "score":        round(score_value, 4),
        "details":      details,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
