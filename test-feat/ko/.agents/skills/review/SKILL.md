---
name: review
description: 구현과 독립된 새 세션에서 ep와 diff만으로 수행하는 코드 리뷰. 고치지 않고 판정만.
disable-model-invocation: true
---

# review — 독립 리뷰 (새 세션 전용)

## 오염 가드

이 세션에 해당 ep의 구현·계획 대화가 이미 있으면 중단한다:
"독립 리뷰는 깨끗한 새 세션에서 실행하세요." 구현 맥락을 아는 리뷰어는
자기 논리에 관대해진다 — 그것이 이 스킬이 분리된 이유다.

## 입력 (이것만 읽는다)

- ep의 **Purpose · Acceptance Criteria · Affected Files**
- **`git diff`** (해당 변경 범위)
- AGENTS.md 전역 규칙

Change Log의 Why 서술과 구현 세션의 자기 평가는 **읽지 않는다** —
주장(계획)과 원자료(diff)만으로 판단한다.

## 절차

1. diff의 각 변경을 인수 기준과 대조한다 — 기준을 실제로 충족하는가.
2. 범위 검사 — Affected Files 밖의 변경이 diff에 있는가.
3. 전역 규칙(AGENTS.md)과 명백한 결함을 검사한다.
4. 발견을 분류한다: **BLOCKER**(병합 불가 결함) / **WARNING**(위험) /
   **NOTE**(참고). 각 발견은 `파일:줄` 근거를 갖는다.
5. ep에 `## Review` append:
   `verdict: APPROVED | NEEDS_REVISION` (BLOCKER 0개 = APPROVED) + 발견 목록.

**고치지 않는다.** 수정은 원 세션 또는 새 ep의 몫이다 — 판정과 근거만 남긴다.

**완료 기준:** ep에 `## Review` 존재 + 모든 발견이 `파일:줄` 근거 보유.
