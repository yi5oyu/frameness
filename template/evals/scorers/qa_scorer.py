"""
qa 스킬 채점기.

구조적 검증만 수행: 테스트 파일 생성 여부, QA 리포트 파일 존재,
최종 상태 레이블([QA PASSED]/[QA FAILED]) 존재, mutation 금지 확인.
"""

import glob
import os
from datetime import datetime, timezone
from typing import Any

# --- 채점 항목별 가중치 ---
WEIGHTS: dict[str, float] = {
    "test_files_created":   0.30,
    "report_written":       0.30,
    "status_label_present": 0.25,
    "no_mutation":          0.15,
}

# 프로젝트 내 테스트 디렉토리 후보 (glob 패턴)
TEST_DIR_PATTERNS: list[str] = [
    "tests/**/*.py",
    "tests/**/*.spec.*",
    "tests/**/*.test.*",
    "src/**/__tests__/**/*",
    "playwright/**/*.spec.*",
    "cypress/**/*.spec.*",
]

QA_STATUS_MARKERS: list[str] = ["[QA PASSED]", "[QA FAILED]"]


def score(case: dict[str, Any], log: dict[str, Any], project_root: str) -> dict[str, Any]:
    """
    하나의 골든 케이스와 실행 로그를 받아 EvalResult를 반환한다.

    Parameters
    ----------
    case         : cases/qa.json 항목 하나
    log          : logs/latest.json 전체 딕셔너리
    project_root : 평가 대상 프로젝트의 절대 경로
    """
    expected = case.get("expected_behavior", {})
    output   = log.get("output_result", {})
    details: dict[str, Any] = {}

    # 1. 테스트 파일 생성 여부
    # 로그에 test_files_written 목록이 있으면 우선 사용, 없으면 glob 폴백
    log_test_files: list[str] = output.get("test_files_written", [])
    if log_test_files:
        test_created = len(log_test_files) > 0
        test_note    = f"로그 기반 확인: {log_test_files}"
    else:
        found_test_files: list[str] = []
        for pattern in TEST_DIR_PATTERNS:
            found_test_files.extend(
                glob.glob(os.path.join(project_root, pattern), recursive=True)
            )
        test_created = len(found_test_files) > 0
        test_note    = f"glob 기반: {len(found_test_files)}개 테스트 파일 발견"
    details["test_files_created"] = {
        "passed": test_created,
        "weight": WEIGHTS["test_files_created"],
        "note":   test_note,
    }

    # 2. QA 리포트 파일 존재
    report_glob  = os.path.join(
        project_root, "docs", "exec-plans", "active", "verification", "qa-report-*.md"
    )
    report_files = glob.glob(report_glob)
    report_ok    = len(report_files) > 0
    details["report_written"] = {
        "passed": report_ok,
        "weight": WEIGHTS["report_written"],
        "note":   f"발견된 리포트: {[os.path.basename(f) for f in report_files]}",
    }

    # 3. 상태 레이블 존재 ([QA PASSED] 또는 [QA FAILED])
    status_ok   = False
    status_note = "QA 리포트 없음 — 상태 레이블 검사 불가"
    if report_files:
        for report_file in report_files:
            with open(report_file, encoding="utf-8") as f:
                content = f.read()
            if any(marker in content for marker in QA_STATUS_MARKERS):
                status_ok   = True
                status_note = f"상태 레이블 확인: {os.path.basename(report_file)}"
                break
        if not status_ok:
            status_note = "리포트 파일에 [QA PASSED]/[QA FAILED] 레이블 없음"
    details["status_label_present"] = {
        "passed": status_ok,
        "weight": WEIGHTS["status_label_present"],
        "note":   status_note,
    }

    # 4. 소스 코드 mutation 시도 없음 (프로덕션 코드 수정 금지 확인)
    mutation_attempted = bool(output.get("mutation_attempted", False))
    no_mutation = not mutation_attempted
    details["no_mutation"] = {
        "passed": no_mutation,
        "weight": WEIGHTS["no_mutation"],
        "note": "프로덕션 소스 파일 수정 없음" if no_mutation else "⚠️ 프로덕션 소스 파일 변경 시도 감지됨",
    }

    # --- 가중 평균 점수 계산 ---
    score_value = sum(
        WEIGHTS[key] * (1.0 if d["passed"] else 0.0)
        for key, d in details.items()
    )
    passed = all(d["passed"] for d in details.values())

    return {
        "case_id":      case["id"],
        "skill":        "qa",
        "passed":       passed,
        "score":        round(score_value, 4),
        "details":      details,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
