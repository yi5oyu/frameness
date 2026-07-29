# ep-{YYYYMMDD}-{slug}: {작업 이름}

**Status:** [Draft]
<!-- Draft → Approved → In Progress → Done.
     상태는 항상 그 상태를 만든 변경보다 먼저 기록한다. -->

> 당신은 상태가 없는 에이전트일 수 있다 — 지난 대화에 기대지 말고, 이 파일과
> 코드베이스만으로 작업을 끝낼 수 있게 쓴다.

## Purpose

<!-- 왜 이 변경이 필요한가. 끝난 뒤 무엇을 보면 동작을 확인할 수 있는가. 1-3줄. -->

## Decisions

<!-- 갈림길에서 무엇을 택했고 무엇을 버렸는가. 버린 이유가 핵심이다.
     없으면 비운다. plan이 인터뷰 중에, debug가 근본 원인을 확인한 뒤 채운다.

     - 세션 저장을 Redis로 — JWT 무상태는 즉시 무효화가 안 됨
-->

## Affected Files

<!-- 바꿀 소스 파일의 레포 루트 기준 경로. 한 줄에 하나. 폴더 전체는 끝에 / .
     여기 없는 소스 파일은 고칠 수 없다 — 먼저 추가하고 재승인받는다.
     승인된 소스의 테스트 파일은 함께 승인된 것으로 본다 — 따로 적지 않는다. -->
- src/example.ts

## Acceptance Criteria

<!-- 사람이 확인할 수 있는 구체적 조건. 확인이 끝나면 근거를 같은 줄에 남긴다.

     - [x] 잘못된 비밀번호로 로그인하면 401 — `src/auth/login.test.ts:42`
     - [x] README에 설치 안내 추가 — 수동 확인: 렌더링 확인
     - [ ] 소셜 로그인 연동
-->
- [ ] {판정 가능한 기준 1}

## Risk

<!-- execute 1단계가 위험 신호를 만났을 때만 채운다.
     전역 상태 · 공개 API 변경 · 마이그레이션 · 인증/보안 -->

(해당 없음)

## Implementation Order

<!-- execute 2단계가 채운다.
     {n}. {경로} {CREATE|MODIFY|DELETE} — {왜, 한 줄} -->

## Approval

<!-- 재승인은 새 항목이며, 마지막 항목이 유효한 승인이다.

     ### {ISO8601}
     - Approver input: "{사람의 입력 그대로}"
     - Approved files:
       - src/example.ts
     - Acceptance: {유효한 기준 사본}
-->

(아직 없음)

## Change Log

<!-- {ISO8601} {CREATE|MODIFY|DELETE} {경로} — {왜, 한 줄} -->

## Review

<!-- review 스킬이 채운다. 선택.
     verdict: APPROVED | NEEDS_REVISION
     - BLOCKER|WARNING|NOTE {file:line} — {내용} -->

(실행 안 함)

## Run History

<!-- {ISO8601} {절차} {DONE|ABORTED|FAILED} — {한 줄}
     2026-07-28T14:22:00+09:00 execute DONE — 42 tests green, build ok -->