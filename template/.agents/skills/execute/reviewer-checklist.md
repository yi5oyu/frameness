# Reviewer Checklist

<!-- 
  이 파일은 execute 스킬 Phase 4(Reviewer)가 내부적으로 로드하는 검토 체크리스트입니다.
  사용자에게 직접 노출되지 않으며, 에이전트가 review-report.md를 작성하기 전에 참조합니다.
  각 항목을 검토한 후 발견된 문제를 BLOCKER / WARNING / NOTE로 분류합니다.
-->

## 1. 계획 이탈 체크 (BLOCKER 후보)

- [ ] 변경된 파일이 모두 `ep-*.md`의 `Affected Files` 또는 `Implementation Order`에 명시되어 있는가?
- [ ] 삭제된 파일이 계획에 명시된 `DELETE` 항목에만 해당하는가?
- [ ] 새로 생성된 파일이 계획에 명시된 `CREATE` 항목에만 해당하는가?
- [ ] 변경 범위가 계획에서 정의한 경계(예: 특정 모듈, 레이어)를 벗어나지 않는가?

## 2. 코드 품질 체크 (BLOCKER 또는 WARNING)

### 2-1. 정적 분석
- [ ] 린트 에러가 없는가? (`eslint`, `ruff`, `flake8` 등 프로젝트 도구 기준)
- [ ] 타입 에러가 없는가? (TypeScript `tsc --noEmit`, Python `mypy` 등)
- [ ] 빌드 에러가 없는가?

### 2-2. 코드 안전성
- [ ] 빈 catch 블록이 없는가? (예외 삼키기 금지)
- [ ] 하드코딩된 매직 넘버나 시크릿이 없는가?
- [ ] `null` / `undefined` / `None` 처리가 누락된 엣지 케이스가 없는가?
- [ ] 새로 추가된 외부 의존성이 있다면, `package.json` 또는 `requirements.txt`에 명시되었는가?

### 2-3. 아키텍처 준수
- [ ] `ARCHITECTURE.md`의 레이어 경계를 위반하지 않는가?
- [ ] 순환 참조가 발생하지 않는가?
- [ ] `docs/design-docs/adr/core-beliefs.md`의 핵심 설계 원칙에 반하지 않는가?

## 3. 테스트 체크 (BLOCKER 또는 WARNING 또는 NOTE)

- [ ] 기존 테스트가 모두 통과하는가?
- [ ] 새로 작성된 소스 파일(CREATE/MODIFY)에 대해 TDD 사이클(RED→GREEN→REFACTOR)이 적용되었는가?
  - 적용 안 됨 (테스트 자체 없음) → **BLOCKER**
  - 테스트 있으나 구현 후 작성 정황 (즉시 통과, 실패 확인 불가) → **WARNING**
- [ ] 변경된 기능에 대한 테스트가 존재하는가? (존재하지 않으면 NOTE)
- [ ] 새로 추가된 `DELETE` 항목에 대한 의존 테스트가 제거되거나 업데이트되었는가?

## 4. 롤백 가능성 체크 (BLOCKER 후보)

- [ ] `implementation-log.md`의 모든 `SUCCESS` 단계가 `ep-*.md`의 롤백 계획대로 역으로 되돌릴 수 있는가?
- [ ] 되돌릴 수 없는 작업(예: 외부 API 호출, DB 마이그레이션)이 있다면 명시적으로 문서화되었는가?

## 5. 분류 기준

| 분류 | 기준 |
|------|------|
| `BLOCKER` | Reviewer Verdict를 `NEEDS_REVISION`으로 강제하는 문제. 빌드 실패, 테스트 실패, 계획 이탈, 보안 취약점, 아키텍처 위반 |
| `WARNING` | 기능은 동작하지만 품질/유지보수에 영향을 주는 문제. 린트 에러, 누락된 타입, 미커버된 엣지 케이스 |
| `NOTE` | 개선 제안. 테스트 미비, 문서 보완 필요, 더 나은 패턴 제안 |

## 6. BLOCKER 발생 후 수정 가이드

> BLOCKER가 발견되면 review-report.md를 읽은 즉시 코드를 수정하지 마세요.
> **근인(root cause) 분석 없는 즉각 패치는 새로운 버그를 만드는 가장 빠른 방법입니다.**

```
BLOCKER 발생
   ↓
/skill:systematic-debugging "증상 설명"
   ↓ Phase 1: Root Cause Investigation (근인 확정 전 수정 금지)
   ↓ Phase 2: Pattern Analysis
   ↓ Phase 3: Hypothesis and Testing
   ↓ Phase 4: Implementation (테스트 케이스 먼저, 수정 후)
   ↓
새 ep-*.md 작성 → /skill:execute 재실행
```

- BLOCKER 수 ≥ 3이고 각 수정마다 새 BLOCKER가 발생하면: `/skill:ralplan`으로 구조적 문제 검토
- 수정 완료 후 검증: `/skill:qa --unit <ep-*.md>`

