#!/usr/bin/env bash
# find-polluter.sh
#
# 목적: 테스트 스위트에서 오염(pollution)을 유발하는 테스트를 이진 탐색으로 찾는다.
#
# 사용 예:
#   ./find-polluter.sh '.git' 'src/**/*.test.ts'
#
# 인자:
#   $1 — 오염 마커: 존재해서는 안 되는 파일/디렉터리 경로 (예: '.git', 'tmp/session')
#   $2 — 테스트 파일 glob 패턴 (예: 'src/**/*.test.ts')
#
# 동작 방식:
#   1. glob 패턴으로 테스트 파일 목록을 수집한다.
#   2. 이진 탐색으로 범위를 반씩 좁혀가며 오염 마커가 생성되는 구간을 찾는다.
#   3. 단일 오염원 테스트를 특정하면 파일명과 줄 번호를 출력하고 종료한다.
#
# 출처: systematic-debugging 스킬 — root-cause-tracing.md

set -euo pipefail

# ──────────────────────────────────────────────
# 인자 검증
# ──────────────────────────────────────────────

if [[ $# -lt 2 ]]; then
  echo "사용법: $0 <오염_마커_경로> <테스트_파일_glob>" >&2
  echo "예시:  $0 '.git' 'src/**/*.test.ts'" >&2
  exit 1
fi

POLLUTION_MARKER="$1"
TEST_GLOB="$2"

# ──────────────────────────────────────────────
# 테스트 파일 목록 수집
# ──────────────────────────────────────────────

# glob 확장을 위해 eval 사용 (따옴표 제거 후 배열로 변환)
mapfile -t TEST_FILES < <(eval "ls $TEST_GLOB 2>/dev/null | sort")

if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
  echo "❌ 테스트 파일을 찾을 수 없습니다: $TEST_GLOB" >&2
  exit 1
fi

TOTAL=${#TEST_FILES[@]}
echo "🔍 총 ${TOTAL}개의 테스트 파일을 탐색합니다."
echo "🎯 오염 마커: $POLLUTION_MARKER"
echo ""

# ──────────────────────────────────────────────
# 유틸리티 함수
# ──────────────────────────────────────────────

# 오염 마커가 존재하는지 확인
marker_exists() {
  [[ -e "$POLLUTION_MARKER" ]]
}

# 오염 마커를 제거한다 (테스트 실행 전 초기화)
cleanup_marker() {
  if [[ -e "$POLLUTION_MARKER" ]]; then
    rm -rf "$POLLUTION_MARKER"
  fi
}

# 주어진 파일 배열로 테스트를 실행하고 오염 여부를 반환한다
# 반환값: 0 = 오염 발생, 1 = 오염 없음
run_subset() {
  local files=("$@")
  cleanup_marker

  # 테스트 러너 자동 감지: npm test → vitest → jest 순서
  if [[ -f "package.json" ]]; then
    local runner
    runner=$(node -e "
      const pkg = require('./package.json');
      const scripts = pkg.scripts || {};
      if (scripts.test) process.stdout.write('npm');
      else process.stdout.write('none');
    " 2>/dev/null || echo "none")

    if [[ "$runner" == "npm" ]]; then
      # 특정 파일만 실행하기 위해 패턴 필터 사용
      npx vitest run "${files[@]}" --reporter=silent 2>/dev/null || true
    fi
  fi

  if marker_exists; then
    return 0  # 오염 발생
  fi
  return 1  # 정상
}

# ──────────────────────────────────────────────
# Step 1: 전체 스위트 실행 → 오염 확인
# ──────────────────────────────────────────────

echo "▶ 전체 스위트 실행 중..."
if ! run_subset "${TEST_FILES[@]}"; then
  echo "✅ 전체 스위트에서 오염이 발생하지 않습니다. 종료합니다."
  exit 0
fi
echo "⚠️  오염 확인됨. 이진 탐색을 시작합니다..."
echo ""

# ──────────────────────────────────────────────
# Step 2: 이진 탐색
# ──────────────────────────────────────────────

LOW=0
HIGH=$((TOTAL - 1))

while [[ $LOW -lt $HIGH ]]; do
  MID=$(( (LOW + HIGH) / 2 ))
  SUBSET=("${TEST_FILES[@]:$LOW:$(( MID - LOW + 1 ))}")

  echo "  탐색 범위: [$LOW .. $MID] (${#SUBSET[@]}개 파일)"

  if run_subset "${SUBSET[@]}"; then
    # 하위 절반에서 오염 발생
    HIGH=$MID
  else
    # 상위 절반으로 범위 이동
    LOW=$(( MID + 1 ))
  fi
done

# ──────────────────────────────────────────────
# Step 3: 결과 출력
# ──────────────────────────────────────────────

POLLUTER="${TEST_FILES[$LOW]}"
echo ""
echo "════════════════════════════════════════"
echo "🐛 오염원 발견: $POLLUTER"
echo "════════════════════════════════════════"
echo ""
echo "다음 단계:"
echo "  1. '$POLLUTER' 파일을 열어 afterEach/afterAll 정리 로직을 확인하세요."
echo "  2. '$POLLUTION_MARKER' 마커를 생성하는 코드를 grep으로 검색하세요:"
echo "     grep -rn '$(basename "$POLLUTION_MARKER")' '$POLLUTER'"
echo "  3. root-cause-tracing.md의 스택 트레이스 추가 기법으로 호출 경로를 역추적하세요."
