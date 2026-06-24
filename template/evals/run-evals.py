"""
run-evals.py — 에이전트 하네스 평가 실행기

진입점:
  python run-evals.py run    [--skill SKILL] [--tag TAG] --project-root PATH
  python run-evals.py report [--last N]
  python run-evals.py promote SKILL "description"

사용 흐름 (반자동):
  1. 에이전트로 스킬을 수동 실행한다.
  2. 에이전트가 evals/logs/latest.json에 실행 결과를 기록한다.
  3. `run` 명령으로 채점한다 → logs/history/*.json(원본)에 누적되고,
     logs/history.md(사람이 읽는 표: 시각/스킬/모델/토큰/소요시간/프롬프트/점수)가 자동 재생성된다.
  4. 결과가 마음에 들면 `promote`로 골든 케이스로 승격한다.
"""

import argparse
import glob
import importlib.util
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from typing import Any


# ---------------------------------------------------------------------------
# 경로 상수
# ---------------------------------------------------------------------------
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
CASES_DIR    = os.path.join(SCRIPT_DIR, "cases")
SCORERS_DIR  = os.path.join(SCRIPT_DIR, "scorers")
LOGS_DIR     = os.path.join(SCRIPT_DIR, "logs")
HISTORY_DIR  = os.path.join(LOGS_DIR, "history")
LATEST_LOG   = os.path.join(LOGS_DIR, "latest.json")
HISTORY_MD   = os.path.join(LOGS_DIR, "history.md")

SKILL_SCORER_MAP: dict[str, str] = {
    "deep-interview": "deep_interview_scorer",
    "ralplan":        "ralplan_scorer",
    "qa":             "qa_scorer",
    "execute":        "execute_scorer",
}


# ---------------------------------------------------------------------------
# 공통 유틸리티
# ---------------------------------------------------------------------------

def _load_json(path: str) -> Any:
    """파일 읽기 실패 시 명확한 오류 메시지를 출력하고 종료한다."""
    if not os.path.isfile(path):
        print(f"❌ 파일을 찾을 수 없습니다: {path}")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError as exc:
            print(f"❌ JSON 파싱 오류 ({path}): {exc}")
            sys.exit(1)


def _save_json(path: str, data: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _load_scorer(skill: str):
    """scorers/ 디렉토리에서 스킬별 채점 모듈을 동적으로 로드한다."""
    module_name = SKILL_SCORER_MAP.get(skill)
    if not module_name:
        print(f"❌ 지원하지 않는 스킬: {skill} (지원: {list(SKILL_SCORER_MAP.keys())})")
        sys.exit(1)

    module_path = os.path.join(SCORERS_DIR, f"{module_name}.py")
    if not os.path.isfile(module_path):
        print(f"❌ 채점기 파일 없음: {module_path}")
        sys.exit(1)

    spec   = importlib.util.spec_from_file_location(module_name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _parse_iso(ts: str) -> datetime | None:
    """ISO8601 문자열을 datetime으로 변환한다. 파싱 실패 시 None."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None


def _format_duration(started_at: str, finished_at: str) -> str:
    """started_at/finished_at 두 타임스탬프로부터 실행 기간(초)을 계산한다."""
    start, end = _parse_iso(started_at), _parse_iso(finished_at)
    if start is None or end is None:
        return "N/A"
    return f"{(end - start).total_seconds():.1f}s"


def _truncate(text: str, length: int = 40) -> str:
    text = (text or "").replace("\n", " ").strip()
    return text if len(text) <= length else text[: length - 1] + "…"


def _archive_log(result: dict[str, Any]) -> str:
    """채점 완료된 로그를 history/ 폴더에 타임스탬프 파일명으로 복사한다."""
    os.makedirs(HISTORY_DIR, exist_ok=True)
    ts       = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    skill    = result.get("skill", "unknown")
    filename = f"{ts}_{skill}.json"
    dest     = os.path.join(HISTORY_DIR, filename)
    _save_json(dest, result)
    return dest


def _build_md_rows(files: list[str]) -> list[dict[str, str]]:
    """history/ 내 원본 JSON 로그들을 사람이 읽는 표용 행(row) 목록으로 변환한다."""
    md_rows: list[dict[str, str]] = []
    for fpath in files:
        data        = _load_json(fpath)
        skill       = data.get("skill", "unknown")
        score       = data.get("eval_score")
        ts          = os.path.basename(fpath).replace(f"_{skill}.json", "")
        token_usage = data.get("token_usage") or {}
        md_rows.append({
            "ts":       ts,
            "skill":    skill,
            "model":    data.get("model") or "N/A",
            "tokens":   str(token_usage.get("total_tokens", "N/A")),
            "duration": _format_duration(data.get("started_at", ""), data.get("finished_at", "")),
            "prompt":   _truncate(data.get("input_prompt", "")),
            "score":    f"{score:.2f}" if score is not None else "N/A",
        })
    return md_rows


def _regenerate_history_md(target_path: str = HISTORY_MD) -> None:
    """logs/history/ 전체를 모아 target_path의 마크다운 표 구간을 재생성한다."""
    files    = sorted(glob.glob(os.path.join(HISTORY_DIR, "*.json")), reverse=True)
    md_rows  = _build_md_rows(files)
    table_md = _build_history_markdown(md_rows)
    _write_md_section(target_path, table_md)


# ---------------------------------------------------------------------------
# 진입점 1: run — 평가 실행 및 채점
# ---------------------------------------------------------------------------

def cmd_run(args: argparse.Namespace) -> None:
    """
    latest.json을 읽어 해당 스킬의 채점기를 실행한다.
    채점 결과를 latest.json에 기록하고 history/에 누적한 뒤,
    사람이 읽는 logs/history.md 표를 자동으로 재생성한다.
    """
    log = _load_json(LATEST_LOG)
    skill = args.skill or log.get("skill")

    if not skill:
        print("❌ 스킬을 특정할 수 없습니다. --skill 옵션을 사용하거나 latest.json에 'skill' 필드를 포함하세요.")
        sys.exit(1)

    case_file = os.path.join(CASES_DIR, f"{skill}.json")
    cases: list[dict] = _load_json(case_file)

    # 태그 필터 적용
    if args.tag:
        cases = [c for c in cases if args.tag in c.get("tags", [])]
        if not cases:
            print(f"⚠️  태그 '{args.tag}'에 해당하는 케이스가 없습니다.")
            return

    project_root = args.project_root
    if not os.path.isdir(project_root):
        print(f"❌ project-root 디렉토리가 존재하지 않습니다: {project_root}")
        sys.exit(1)

    scorer = _load_scorer(skill)

    results: list[dict] = []
    for case in cases:
        result = scorer.score(case, log, project_root)
        results.append(result)
        status = "✅ PASS" if result["passed"] else "❌ FAIL"
        print(f"  {status}  [{result['case_id']}]  score={result['score']:.2f}")

        # 상세 항목 출력
        for item_name, item in result["details"].items():
            icon = "  ✓" if item["passed"] else "  ✗"
            print(f"    {icon} {item_name}: {item['note']}")

    # 전체 요약
    total   = len(results)
    passed  = sum(1 for r in results if r["passed"])
    avg     = sum(r["score"] for r in results) / total if total else 0.0
    print(f"\n{'='*50}")
    print(f"결과: {passed}/{total} 통과  |  평균 점수: {avg:.2f}")
    print(f"{'='*50}")

    # latest.json에 채점 결과 기록 (첫 번째 케이스 기준)
    if results:
        log["eval_score"] = results[0]["score"]
        _save_json(LATEST_LOG, log)

        # history/ 아카이브
        archive_path = _archive_log({**log, "eval_results": results})
        print(f"📁 결과 아카이브: {archive_path}")

        # 사람이 읽는 실행 기록 표 자동 갱신 (logs/history.md)
        _regenerate_history_md()
        print(f"📝 실행 기록 표 갱신: {HISTORY_MD}")


# ---------------------------------------------------------------------------
# 진입점 2: report — 히스토리 요약
# ---------------------------------------------------------------------------

def cmd_report(args: argparse.Namespace) -> None:
    """history/ 내 로그를 최근 N개 읽어 스킬별 점수 추이를 출력한다."""
    pattern      = os.path.join(HISTORY_DIR, "*.json")
    history_files = sorted(glob.glob(pattern), reverse=True)

    if not history_files:
        print("ℹ️  아직 히스토리 로그가 없습니다. 먼저 'run' 명령을 실행하세요.")
        return

    limit = args.last or len(history_files)
    target_files = history_files[:limit]

    # 스킬별 점수 집계 (콘솔 표용)
    skill_scores: dict[str, list[float]] = {}
    rows: list[tuple[str, str, str, str]] = []

    for fpath in target_files:
        data  = _load_json(fpath)
        skill = data.get("skill", "unknown")
        score = data.get("eval_score")
        ts    = os.path.basename(fpath).replace(f"_{skill}.json", "")

        if score is not None:
            skill_scores.setdefault(skill, []).append(score)
        rows.append((ts, skill, f"{score:.2f}" if score is not None else "N/A", "✅" if data.get("eval_score", 0) >= 0.8 else "❌"))

    # 테이블 출력
    print(f"\n{'시각':<20} {'스킬':<18} {'점수':>6}  상태")
    print("-" * 52)
    for ts, skill, score_str, icon in rows:
        print(f"{ts:<20} {skill:<18} {score_str:>6}  {icon}")

    # 스킬별 평균
    print(f"\n{'스킬별 평균':}")
    print("-" * 30)
    for skill, scores in skill_scores.items():
        avg = sum(scores) / len(scores)
        print(f"  {skill:<18}: {avg:.2f}  (n={len(scores)})")

    if args.write_md:
        table_md = _build_history_markdown(_build_md_rows(target_files))
        _write_md_section(args.write_md, table_md)
        print(f"\n📝 실행 기록 표 갱신: {args.write_md}")


# ---------------------------------------------------------------------------
# 사람이 읽는 실행 기록 마크다운 표 생성/주입
# ---------------------------------------------------------------------------

HISTORY_TABLE_START = "<!-- EVALS_HISTORY_TABLE:START (run-evals.py report --write-md 가 자동 생성/갱신함. 직접 수정하지 마세요) -->"
HISTORY_TABLE_END   = "<!-- EVALS_HISTORY_TABLE:END -->"


def _build_history_markdown(md_rows: list[dict[str, str]]) -> str:
    """logs/history/ 전체를 모아 사람이 읽는 실행 기록 표를 생성한다."""
    lines = [
        "| 시각 | 스킬 | 모델 | 토큰(총합) | 소요 시간 | 프롬프트 | 점수 |",
        "|---|---|---|---|---|---|---|",
    ]
    for r in md_rows:
        lines.append(
            f"| {r['ts']} | {r['skill']} | {r['model']} | {r['tokens']} | "
            f"{r['duration']} | {r['prompt']} | {r['score']} |"
        )
    return "\n".join(lines)


def _write_md_section(path: str, table_md: str) -> None:
    """
    path의 마크다운 파일 안에서 HISTORY_TABLE_START~END 사이만 교체한다.
    마커가 없으면 파일 끝에 새 섹션으로 추가한다. 그 외 기존 내용은 보존한다.
    """
    section = f"{HISTORY_TABLE_START}\n{table_md}\n{HISTORY_TABLE_END}"

    existing = ""
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            existing = f.read()

    if HISTORY_TABLE_START in existing and HISTORY_TABLE_END in existing:
        pre  = existing.split(HISTORY_TABLE_START)[0]
        post = existing.split(HISTORY_TABLE_END)[1]
        new_content = pre + section + post
    elif existing:
        separator = "" if existing.endswith("\n\n") else ("\n" if existing.endswith("\n") else "\n\n")
        new_content = f"{existing}{separator}## 실행 기록 (자동 생성)\n\n{section}\n"
    else:
        new_content = f"## 실행 기록 (자동 생성)\n\n{section}\n"

    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)


# ---------------------------------------------------------------------------
# 진입점 3: promote — 골든 케이스 승격 (기존 로직 유지)
# ---------------------------------------------------------------------------

def cmd_promote(args: argparse.Namespace) -> None:
    """
    latest.json 실행 결과를 cases/{skill}.json에 정식 골든 케이스로 등록한다.
    인간이 결과를 확인하고 마음에 들 때만 호출하는 수동 게이트.
    """
    skill       = args.skill_name
    description = args.description or "인간 승인 기반 추가 케이스"
    case_path   = os.path.join(CASES_DIR, f"{skill}.json")

    if not os.path.isfile(LATEST_LOG):
        print("❌ 승격할 최근 실행 로그(latest.json)가 존재하지 않습니다.")
        sys.exit(1)

    latest_data = _load_json(LATEST_LOG)

    new_case = {
        "id":               f"case-{int(os.path.getmtime(LATEST_LOG))}",
        "description":      description,
        "skill":            skill,
        "tags":             [],
        "promoted_at":      datetime.now(timezone.utc).isoformat(),
        "input_prompt":     latest_data.get("input_prompt"),
        "expected_behavior": latest_data.get("output_result"),
    }

    cases: list[dict] = []
    if os.path.isfile(case_path):
        cases = _load_json(case_path)

    cases.append(new_case)
    _save_json(case_path, cases)
    print(f"✅ '{case_path}' 시험지에 골든 케이스로 등록되었습니다: {new_case['id']}")


# ---------------------------------------------------------------------------
# CLI 파서
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="run-evals",
        description="에이전트 하네스 스킬 평가 실행기",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # run
    p_run = sub.add_parser("run", help="latest.json을 채점하고 결과를 기록한다")
    p_run.add_argument("--skill", choices=list(SKILL_SCORER_MAP.keys()), help="평가할 스킬 (미지정 시 latest.json의 skill 필드 사용)")
    p_run.add_argument("--tag",   help="지정 태그를 가진 케이스만 평가")
    p_run.add_argument("--project-root", required=True, metavar="PATH", help="평가 대상 프로젝트 루트 절대 경로")

    # report
    p_report = sub.add_parser("report", help="히스토리 점수 추이를 출력한다")
    p_report.add_argument("--last", type=int, metavar="N", help="최근 N개 로그만 표시 (기본: 전체)")
    p_report.add_argument("--write-md", metavar="PATH", help="logs/history.md 외에 추가로 지정 경로의 마크다운 파일에도 실행 기록 표를 갱신한다 (기존 내용은 보존, 마커 구간만 재생성)")

    # promote
    p_promote = sub.add_parser("promote", help="latest.json을 골든 케이스로 승격한다")
    p_promote.add_argument("skill_name",  choices=list(SKILL_SCORER_MAP.keys()), help="승격할 스킬 이름")
    p_promote.add_argument("description", nargs="?", default=None, help="케이스 설명 (선택)")

    return parser


if __name__ == "__main__":
    parser = build_parser()
    args   = parser.parse_args()

    if args.command == "run":
        cmd_run(args)
    elif args.command == "report":
        cmd_report(args)
    elif args.command == "promote":
        cmd_promote(args)