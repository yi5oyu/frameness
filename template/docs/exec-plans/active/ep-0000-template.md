# ep-{YYYYMMDD}-{branch_name}-{task_slug} : [태스크명 명시]

> **CRITICAL FOR AGENTS (SELF-CONTAINMENT):**
> 당신은 이 리포지토리에 처음 진입한 무맥락(Stateless) 에이전트입니다. 과거 대화나 외부 문서에 의존하지 마십시오. 오직 이 파일에 적힌 지침과 실제 코드 베이스만 보고 기능을 완벽히 구현해야 합니다. 모호한 점은 이 문서 내부에서 스스로 해소하고 기록하십시오.

---

## 1. Purpose / Big Picture
- **왜 이 작업을 하는가 (User Perspective):** 이 변경을 통해 사용자가 기존에 못 하던 어떤 행동을 할 수 있게 되는지 기술합니다.
- **결과 확인 방법:** 구현이 끝난 후, 어떤 화면을 보거나 어떤 API를 찔러야 기능이 도는 것을 눈으로 볼 수 있는지 기술합니다.

## 2. Progress & Milestones
*타임스탬프를 사용하여 세부 단계를 추적합니다. 중간에 멈출 경우 완료(`done`)와 남은 작업(`remaining`)을 명확히 쪼개어 업데이트하세요.*

- [ ] (YYYY-MM-DD HH:MMZ) 인터뷰 및 요구사항 정제 완료 (`deep-interview`)
- [ ] 아키텍트 패널 교차 검증 통과 (`ralplan`)
- [ ] 격리 워크스페이스 생성 완료 (`using-git-worktrees`, 베이스라인 테스트 통과)
- [ ] TDD 사이클 적용하며 구현 완료 (`execute` + `test-driven-development`)
- [ ] Reviewer APPROVED (`review-report.md` 기준)
- [ ] `qa` 최종 인수 테스트 통과 (`[QA PASSED]`)

## 3. Surprises & Discoveries
- *구현 및 검증 과정에서 발견한 예상치 못한 버그, 라이브러리 제약, 최적화 기회 등을 증거 스니펫(에러 로그, 테스트 결과 등)과 함께 기록합니다.*
- **발견:**

## 4. Decision Log (설계 결정 기록)
- *계획을 변경하거나 특정 기술 구조를 선택한 이유를 기록하여 기술 부채 트래커와 연동합니다.*
- **Decision:**
- **Rationale:**
- **Date/Author:**

## 5. Context and Orientation (레포지토리 컨텍스트)
- 본 작업을 수행하기 위해 참조하거나 수정해야 하는 파일들의 **전체 상대 경로**를 명시합니다.
- 예: `src/main/java/com/example/api/UserController.java`
- 용어 정의: (예: 사용하는 특정 미들웨어나 커스텀 어노테이션의 의미를 기술)

## 6. Plan of Work & Concrete Steps
- 에이전트나 인간이 순서대로 실행해야 할 터미널 명령어와 구체적인 작업 위치를 기술합니다.
- 예: `cd` 경로 이동 후 `./gradlew test` 실행 등 (예상되는 출력 로그 예시 포함)

## 7. Validation and Acceptance
- **인간이 검증 가능한 구체적 행위:** "서버 가동 후 `POST /api/v1/users` 요청 시 201 반환"
- **테스트 러너 기준:** "시행 전 테스트 실패 ➡️ 소스코드 구현 후 `qa` 스킬 실행 시 100% Pass"