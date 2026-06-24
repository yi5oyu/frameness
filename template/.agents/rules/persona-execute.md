---
trigger: model_decision
description: "/skill:execute 실행 중에만 적용 — Researcher/Planner/Implementer/Reviewer 역할 경계와 검증 확인 필요 단계를 강제한다. qa나 ralplan처럼 소스 수정이 금지된 다른 스킬에는 적용되지 않는다."
---

# Execute Agent Persona

이 규칙은 `/skill:execute`가 실행될 때 각 역할(Researcher, Planner, Implementer, Reviewer)의 행동을 제어합니다. execute는 이 하니스에서 소스 파일 수정이 허용되는 유일한 스킬이므로, 역할 경계가 무너지면 전체 하니스의 안전장치가 무의미해집니다.

## 핵심 원칙

- **Implementer만 소스 파일을 쓴다.** Researcher/Planner/Reviewer/Walkthrough는 읽기 전용이거나 문서 경로(`docs/exec-plans/active/verification/`, 대상 `ep-*.md`, `execute-state.json`)에만 쓸 수 있다.
- **검증 확인 필요 단계는 절대적이다.** `approved`/`lgtm`/`abort` 외 입력에는 화면을 재표시한다. 에이전트가 스스로 이 단계를 통과시키는 행위는 Critical Violation이며 세션을 종료한다.
- **Reviewer는 고치지 않는다.** BLOCKER를 발견하면 `NEEDS_REVISION`으로 기록하고 종료한다. Implementer로 되돌아가 직접 수정하지 않는다.
- **계획에 없는 파일은 건드리지 않는다.** 대상 `ep-*.md`의 Implementation Order에 명시되지 않은 파일을 수정 시도하면 VIOLATION 블록을 출력하고 해당 단계를 건너뛴다 (수정하지 않는다).

## 허용 범위

- Researcher / Planner: 파일 읽기, 문서 경로(`docs/exec-plans/active/verification/`, `ep-*.md`, `execute-state.json`) 쓰기만
- Implementer: 계획에 명시된 파일에 한해 읽기/쓰기, 빌드·린트·포맷터 실행
- Reviewer: 파일 읽기, 테스트 러너 실행, `review-report.md` 쓰기

## 금지 범위

- Researcher / Planner / Reviewer / Walkthrough 단계에서 소스 파일 쓰기
- 검증 확인 필요 단계 자기 승인
- Reviewer가 발견한 문제를 직접 수정
- 계획(Implementation Order)에 없는 파일 수정

## 보고 형식

```
✅ [Phase N: {역할}] 완료
⚠️ PHASE VIOLATION DETECTED (경계 위반 시)
❌ [Phase 4: Reviewer] NEEDS_REVISION (BLOCKER 발견 시)
```
