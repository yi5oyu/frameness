# AGENTS.md



## Project Overview

## Knowledge Map

### Tasks & Execution
- **마스터 로드맵:** 프로젝트 루트의 [`PLANS.md`](./PLANS.md)에서 전체 대시보드를 관리합니다. 
  *(주의: 멀티 브랜치 동시 작업 시 메인 브랜치 머지 과정에서 PLANS.md 충돌이 발생할 수 있으며, 이는 인간 개발자가 최종 병합 시 수동으로 해결합니다.)*
- **실행 계획 생성 규칙:** 일련번호 중복 충돌을 방지하기 위해 파일명 규칙은 고정 번호 대신 날짜와 브랜치명을 조합합니다.
  1. **파일 명명 규칙:** `ep-{YYYYMMDD}-{branch_name}-{task_slug}.md` 형식을 엄격히 준수하세요.
     (예: `ep-20260618-feat-admin-api-endpoint.md`)
  2. **파일 생성:** `deep-interview` 완료 후, 최종 정제된 계획을 [`docs/exec-plans/active/`](./docs/exec-plans/active/) 경로에 생성하고 `[Pending Approval]` 상태 레이블을 부여하세요.
  
### Product Specs
- **제품 매크로 요구사항 (PRD):** 이 시스템이 무엇을 왜 만드는지 전반적인 기획 의도는 [`./docs/product-specs/PRD.md`](./docs/product-specs/PRD.md)를 필독하세요.
- **기능별 상세 명세:** 구체적인 화면이나 기능 구현 요구사항은 [`./docs/product-specs/`](./docs/product-specs/) 폴더 내의 관련 문서를 탐색하세요.

### Architecture & Design
- **시스템 상위 구조:** 프로젝트 루트의 [`ARCHITECTURE.md`](./ARCHITECTURE.md)를 참조하세요.
- **아키텍처 결정 기록 (ADR):** 과거 기술 핵심 설계 사상과 히스토리는 [`./docs/design-docs/adr/`](./docs/design-docs/adr/) 폴더를 확인하세요.
- **ADR 생성 규칙:** `ralplan`을 통해 새로운 기술적 합의를 명문화할 때 에이전트는 반드시 아래 규칙을 따릅니다.
  1. **파일명:** `docs/design-docs/adr/core-beliefs.md` 및 `NNNN-kebab-case.md` 형식 준수.
  2. **포맷:** 반드시 폴더 내의 템플릿 구조를 복사하여 아키텍처 결정 배경과 제약 조건을 누락 없이 채우세요.

### Guardrails & Quality
- **전역 에이전트 행동 규칙:** 코드 스타일, 언어 규칙, 금지 패턴은 [`.agents/rules/global.md`](./.agents/rules/global.md)에 정의합니다.
  - 이 파일은 에이전트 런타임에 자동 주입되는 시스템 레이어입니다. 프로젝트별 규칙을 이곳에 채워 넣으세요.
- **QA 페르소나 규칙:** QA 역할 전용 행동 지침은 [`.agents/rules/persona-qa.md`](./.agents/rules/persona-qa.md)를 참조하세요.

### LLM-friendly References

## Development Commands

### 전체 파이프라인 (권장)

새 기능 개발의 표준 워크플로우입니다. 각 단계는 이전 단계의 산출물이 있어야 진입 가능합니다.

```
1단계: 요구사항 명확화
   /skill:deep-interview "구현하고 싶은 아이디어"
   → 산출물: docs/product-specs/PRD.md
             docs/exec-plans/active/ep-{slug}.md  [Pending Approval]

2단계: 아키텍처 검증
   /skill:ralplan docs/exec-plans/active/ep-{slug}.md
   → 산출물: docs/exec-plans/active/verification/stage-*-*.md
             docs/exec-plans/active/ep-{slug}.md  [Pending Approval] (검증 완료)

2.5단계: 격리 워크스페이스 생성  ← 소스 수정 발생 전 최후 시점
   /skill:using-git-worktrees
   → 새 브랜치 + 워크트리 폴더 생성, 베이스라인 테스트 통과 확인
   ※ deep-interview·ralplan은 소스를 수정하지 않으므로 메인에서 진행 가능
   ※ execute가 첫 번째 소스 수정 → 그 직전에 격리 필요

3단계: 구현 실행  (격리된 워크트리 안에서)
   /skill:execute docs/exec-plans/active/ep-{slug}.md
   → 산출물: docs/exec-plans/active/verification/research-brief.md
             docs/exec-plans/active/verification/implementation-log.md
             docs/exec-plans/active/verification/review-report.md
             evals/logs/latest.json
```

### 개별 스킬 호출

```bash
# 요구사항만 (구현 없음)
/skill:deep-interview "아이디어"

# 아키텍처 검증만 (이미 ep-*.md가 있을 때)
/skill:ralplan docs/exec-plans/active/ep-{slug}.md

# 격리 워크스페이스 생성 (execute 직전 — 소스 수정 전 최후 시점)
/skill:using-git-worktrees

# 구현만 (ralplan 통과된 ep-*.md가 있을 때)
# → Phase 3 Implementer 내부에서 자동으로 TDD 사이클 적용
/skill:execute docs/exec-plans/active/ep-{slug}.md

# TDD (execute Phase 3 Implementer와 함께 사용. 독립 호출도 가능)
/skill:test-driven-development

# QA (구현 완료 후 — TDD와 역할 분리: qa는 구현 *후* 계획 대비 검증)
/skill:qa --unit docs/exec-plans/active/ep-{slug}.md
/skill:qa --e2e docs/exec-plans/active/ep-{slug}.md
```

### 버그 및 장애 대응

개발 파이프라인과 독립적으로, **어느 단계에서든** 예상치 못한 동작이 발생하면 진입합니다.

```
버그 발생 (테스트 실패 / 예외 / 이상 동작)
   /skill:systematic-debugging "증상 설명"
   → 4-Phase 프로세스: Root Cause → Pattern → Hypothesis → Implementation
   → 근인(root cause) 확인 전 코드 수정 절대 금지

수정 후 복귀 경로:
   - 코드 수정 → /skill:execute 새 세션 (ep-*.md 필요)
   - 구조적 문제 발견 → /skill:ralplan 으로 아키텍처 재검토
   - 수정 완료 검증 → /skill:qa --unit <ep-*.md>
```

> **⚠️ execute NEEDS_REVISION 발생 시:** review-report.md의 BLOCKER를 즉시
> 패치하지 말고, 반드시 `/skill:systematic-debugging`으로 근인 분석을 먼저 완료하세요.

### Evals (평가)

```bash
# 직전 실행 채점
python evals/run-evals.py run --skill execute --project-root ./

# 히스토리 요약
python evals/run-evals.py report --last 10

# 마음에 드는 결과를 골든 케이스로 승격
python evals/run-evals.py promote execute "설명"
```

## Code style


## Testing instructions