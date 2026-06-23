"""
ralplan 스킬 채점기.

구조적 검증만 수행: 스테이지 파일 존재, 최종 플랜 상태 텍스트, 로그 플래그.
"""

import glob
import json
import os
from datetime import datetime, timezone
from typing import Any

# --- 채점 항목별 가중치 ---
WEIGHTS: dict[str, float] = {
    "planner_stage_exists":   0.20,
    "architect_stage_exists": 0.20,
    "critic_stage_exists":    0.20,
    "pending_approval_label": 0.25,
    "no_mutation":            0.15,
}

PENDING_APPROVAL_MARKER = "[Pending Approval]"


def score(case: dict[str, Any], log: dict[str, Any], project_root: str) -> dict[str, Any]:
    """
    하나의 골든 케이스와 실행 로그를 받아 EvalResult를 반환한다.

    Parameters
    ----------
    case         : cases/ralplan.json 항목 하나
    log          : logs/latest.json 전체 딕셔너리
    project_root : 평가 대상 프로젝트의 절대 경로
    """
    expected = case.get("expected_behavior", {})
    output   = log.get("output_result", {})
    details: dict[str, Any] = {}

    verification_dir = os.path.join(
        project_root, "docs", "exec-plans", "active", "verification"
    )

    # 1. Planner 스테이지 파일 존재
    planner_glob  = os.path.join(verification_dir, "stage-*-planner.md")
    planner_files = glob.glob(planner_glob)
    planner_ok    = len(planner_files) > 0
    details["planner_stage_exists"] = {
        "passed": planner_ok,
        "weight": WEIGHTS["planner_stage_exists"],
        "note": f"발견: {[os.path.basename(f) for f in planner_files]}",
    }

    # 2. Architect 스테이지 파일 존재
    architect_glob  = os.path.join(verification_dir, "stage-*-architect.md")
    architect_files = glob.glob(architect_glob)
    architect_ok    = len(architect_files) > 0
    details["architect_stage_exists"] = {
        "passed": architect_ok,
        "weight": WEIGHTS["architect_stage_exists"],
        "note": f"발견: {[os.path.basename(f) for f in architect_files]}",
    }

    # 3. Critic 스테이지 파일 존재
    critic_glob  = os.path.join(verification_dir, "stage-*-critic.md")
    critic_files = glob.glob(critic_glob)
    critic_ok    = len(critic_files) > 0
    details["critic_stage_exists"] = {
        "passed": critic_ok,
        "weight": WEIGHTS["critic_stage_exists"],
        "note": f"발견: {[os.path.basename(f) for f in critic_files]}",
    }

    # 4. 최종 ep-*.md 파일에 [Pending Approval] 레이블 존재
    ep_glob  = os.path.join(project_root, "docs", "exec-plans", "active", "ep-*.md")
    ep_files = glob.glob(ep_glob)
    pending_ok = False
    pending_note = "ep-*.md 파일을 찾을 수 없음"
    if ep_files:
        for ep_file in ep_files:
            with open(ep_file, encoding="utf-8") as f:
                content = f.read()
            if PENDING_APPROVAL_MARKER in content:
                pending_ok   = True
                pending_note = f"'{PENDING_APPROVAL_MARKER}' 확인: {os.path.basename(ep_file)}"
                break
        if not pending_ok:
            pending_note = f"ep 파일 {len(ep_files)}개 중 '{PENDING_APPROVAL_MARKER}' 없음"
    details["pending_approval_label"] = {
        "passed": pending_ok,
        "weight": WEIGHTS["pending_approval_label"],
        "note": pending_note,
    }

    # 4. 소스 코드 mutation 시도 없음
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
        "skill":        "ralplan",
        "passed":       passed,
        "score":        round(score_value, 4),
        "details":      details,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
