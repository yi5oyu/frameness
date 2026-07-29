---
name: review
description: 구현과 독립된 새 세션에서 ep와 diff만으로 하는 코드 리뷰. 판정만 남기고 고치지 않는다.
disable-model-invocation: true
---

# review — 독립 리뷰 (새 세션 전용)

## 오염 가드

이 세션에 해당 ep의 구현이나 계획 대화가 이미 들어 있으면 멈춘다:
"독립 리뷰는 깨끗한 새 세션에서 돌리세요."
구현 맥락을 아는 리뷰어는 그 논리에 관대해진다 — 이 스킬이 따로 있는 이유다.

## 입력 (이것만 읽는다)

- ep의 **Purpose · Acceptance Criteria · Affected Files**
- **diff** — 이미 커밋됐으면 `ep: {slug}` 트레일러로 커밋을 찾아 그 diff,
  아직이면 `git diff`
- 루트 AGENTS.md의 규칙과, 변경이 걸친 폴더 AGENTS.md의 `## 금지`

Change Log의 사유 메모나 구현 세션의 자기 평가는 읽지 **않는다** — 주장(계획)과
원재료(diff)만으로 판단한다.

## 절차

1. diff의 변경을 하나씩 기준과 대조한다 — 실제로 충족됐는가?
2. 범위 확인 — Affected Files 밖의 변경이 diff에 있는가?
3. 규칙 위반과 명백한 결함을 확인한다.
4. 지적을 분류한다: **BLOCKER**(머지 불가 결함) / **WARNING**(위험) /
   **NOTE**(참고). 모든 지적에 `파일:줄` 근거를 단다.
5. ep의 `## Review`를 채운다:
   `verdict: APPROVED | NEEDS_REVISION` (BLOCKER 0개면 APPROVED) + 지적들.
6. ep `## Run History` 1줄.

**고치지 않는다.** `NEEDS_REVISION`이면 수정은 **새 ep**로 간다 — 원 ep는
`[Done]`인 채로 두고 `## Review`가 그 근거로 남는다.

같은 지적이 반복되면 그 폴더 AGENTS.md의 `## 금지`에 올릴 것을 제안한다.

**끝났다고 볼 때:** ep에 `## Review`가 있고 · 모든 지적에 `파일:줄` 근거가 있고 ·
Run History 1줄이 있다.
