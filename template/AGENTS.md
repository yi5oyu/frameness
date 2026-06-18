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

### LLM-friendly References

## Development Commands

## Code style


## Testing instructions