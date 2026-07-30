---
name: execute
description: ep 계획을 받아 조사→순서→승인→구현→마감을 한 세션에서 완주한다. 산출물은 전부 ep에 기록.
disable-model-invocation: true
---

# execute — 계획을 구현으로

입력: `docs/plans/active/ep-*.md` 하나.

## 가드

- ep가 없으면: 코어 절차 ① 또는 plan 스킬로 계획을 먼저 만들라고 안내하고 종료.
- 레이블 검사: `[Draft]` → 진행(승인 게이트 필수) · `[Approved]` → 진행 ·
  `[In Progress]` → 이전 세션이 중단된 것 — `[Draft]` 롤백 + Change Log에
  사유 1줄 후 재시작 · `[Done]` → 완료된 계획은 재실행하지 않는다, 종료.

## 1. 조사 (읽기 전용)

Affected Files 각각: 읽기 → import 1단계 의존 확인 → 대응 테스트 유무.
위험 신호(전역 상태 · public API 변경 · 마이그레이션 · auth/보안)를 발견하면
ep에 `## Risk`로 사유를 append한다. 계획에 없는 파일이 필요함을 발견하면
Affected Files에 추가하고 사유를 적는다 — 승인은 다음 게이트에서 한 번에 받는다.

## 2. 순서

ep에 `## Implementation Order` append — 항목마다:
`{번호}. {경로} {CREATE|MODIFY|DELETE} — {Why 한 줄}`.
인수 기준과 대조해 빠진 파일이 없는지 확인한다.

## 3. 승인 게이트

AGENTS.md 계약 §승인 대기 형식대로 표시하고 대기한다.
Risk가 있으면 요약에 포함한다. (게이트 규칙 전문은 계약 — 여기 재기술하지 않는다.)

## 4. 구현

Implementation Order 순서대로, 항목마다:

- **tdd 규율로** (RED→GREEN — `.agents/skills/tdd/SKILL.md`)
- 변경 **즉시** ep `## Change Log` 1줄 (계약 §증거 형식)
- 항목이 실패하면 실패로 기록하고 다음 항목으로 진행한다 — 계획 밖 파일로
  만회하지 않는다 (필요해지면 계약 §계획에 없는 파일 절차).

## 5. 마감

빌드·전체 테스트 실행 → 결과를 있는 그대로 제시한다.
Risk가 있거나 변경이 4파일 이상이면 안내한다:
"독립 리뷰를 원하시면 **새 세션 — 가능하면 구현과 다른 모델 —** 에서
`review ep-{slug}`를 요청하세요."
인간 lgtm → 코어 절차 ⑤ (Run History 1줄 → done/ 이동 → 커밋은 계약 §커밋 규약).

**완료 기준:** 매 단계의 산출물이 ep 안에 존재하고, 종료 시 — abort·실패
포함 — Run History 1줄이 있다. 기록 없는 실행은 존재하지 않은 실행이다.
