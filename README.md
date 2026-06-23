# Frameness

AI 에이전트가 소스 파일을 수정하기 전에 반드시 거쳐야 하는 **구조화된 검증 파이프라인**을 프로젝트에 설치하는 CLI 도구.

```
npx frameness
```

---

## 개요

에이전트에게 "만들어줘"라고 말하는 순간, 에이전트는 요구사항이 모호해도, 아키텍처가 검토되지 않았어도, 테스트가 없어도 즉시 코드를 수정합니다.

Frameness는 이 흐름을 차단합니다. 설치 후 에이전트는 아래 단계를 거치기 전까지 소스 파일에 접근할 수 없습니다.

```
요구사항 명확화 → 아키텍처 합의 → 인간 승인 → 구현 (TDD) → 검증
```

각 단계는 이전 단계의 파일 산출물을 전제조건으로 검사합니다. 파일이 없으면 다음 단계로 진입할 수 없습니다.

---

## 설치

**Node.js 18 이상 필요.**

```bash
# 프로젝트 루트로 이동
cd my-project

# 실행
npx frameness
```

전역 설치도 가능합니다.

```bash
npm install -g frameness
frameness
```

---

## 초기화 모드

실행하면 3가지 설치 모드를 선택할 수 있습니다.

```
=================================
   🪄 Welcome to frameness CLI
=================================
1. 🚀 전체 하네스 구성 불러오기 (Full)
2. 📄 주요 가드레일 파일만 불러오기 (Main Files Only)
3. 🧠 에이전트 스킬 세트만 불러오기 (Skills Only)
4. ❌ 종료하기
=================================
```

### 1. Full — 전체 하네스

```
.agents/          ← 에이전트 규칙 + 스킬 7종 + 설정
docs/             ← PRD, 실행 계획, ADR 템플릿
evals/            ← 스킬 평가 시스템 (채점기, 케이스, 로그)
AGENTS.md         ← 에이전트 진입점 (스킬 호출 레퍼런스)
ARCHITECTURE.md   ← 시스템 아키텍처 (빈 템플릿)
PLANS.md          ← 마스터 로드맵 (빈 템플릿)
```

완전한 하네스 파이프라인이 필요한 신규 프로젝트에 권장합니다.

### 2. Main — 가드레일 파일만

`AGENTS.md`, `ARCHITECTURE.md`, `PLANS.md` 세 파일만 설치합니다. 이미 자체 스킬 구조가 있거나 에이전트 행동 가이드만 필요한 프로젝트에 적합합니다.

### 3. Skills Only — 스킬 세트만

`.agents/skills/` 디렉터리와 `settings.json`만 설치합니다. 기존 프로젝트에 스킬만 추가할 때 사용합니다. `deep-interview`의 blocking prerequisite인 `settings.json`은 기존 파일이 없을 경우에만 함께 설치됩니다.

> **기존 파일 보호:** Full / Main 모드는 `AGENTS.md`, `ARCHITECTURE.md`, `PLANS.md`가 이미 존재할 경우 덮어쓰기 여부를 확인합니다.

---

## 설치 후: 프로젝트에 맞게 채우기

설치된 파일 중 아래 항목은 **의도적으로 비워진 플레이스홀더**입니다. 프로젝트 도메인에 맞게 직접 채워야 합니다.

| 파일 | 채울 내용 |
|------|---------|
| `AGENTS.md` → Project Overview | 프로젝트 목적, 팀 컨텍스트 |
| `AGENTS.md` → Code style | 언어, 포맷터, 네이밍 컨벤션 |
| `AGENTS.md` → Testing instructions | 테스트 러너, 커버리지 기준 |
| `ARCHITECTURE.md` | 시스템 구조, 기술 스택, 주요 컴포넌트 |
| `docs/design-docs/adr/core-beliefs.md` | 팀이 합의한 핵심 설계 원칙 |
| `.agents/settings.json` | 프로젝트명, 언어, `source_dirs` |

### settings.json 주요 항목

```jsonc
{
  "project_name": "My Project",    // 프로젝트 이름
  "language": "ko",                // 에이전트 출력 언어

  "deep_interview": {
    "ambiguity_threshold": 0.05,   // 모호도 허용 상한 (5%)
    "max_rounds": 20,              // 최대 인터뷰 라운드
    "soft_warning_rounds": 10      // 소프트 경고 시점
  },

  "source_dirs": [                 // 소스 파일 경계 (기술 스택에 맞게 수정)
    "src", "lib", "app",
    "pages", "components"
  ],

  "paths": {
    "prd": "docs/product-specs/PRD.md",
    "exec_plan_dir": "docs/exec-plans/active/"
  }
}
```

`source_dirs`는 `execute` 스킬이 소스 파일 수정 경계를 판단할 때 사용합니다. 모노레포나 비표준 경로를 쓰는 프로젝트는 이 항목을 반드시 수정하세요.

---

## 디렉터리 구조 (Full 설치 후)

```
my-project/
├── .agents/
│   ├── rules/
│   │   ├── global.md              # 전역 에이전트 행동 규칙 (자동 주입)
│   │   └── persona-qa.md          # QA 역할 전용 페르소나
│   ├── skills/
│   │   ├── deep-interview/        # 요구사항 명확화
│   │   ├── ralplan/               # 아키텍처 합의 검증
│   │   ├── using-git-worktrees/   # 격리 워크스페이스 생성
│   │   ├── execute/               # 구현 실행 (5-Phase 게이트)
│   │   ├── test-driven-development/ # TDD 사이클 강제
│   │   ├── qa/                    # 자동화 테스트 생성·실행
│   │   └── systematic-debugging/  # 근인 분석 (버그·장애 대응)
│   ├── workflows/                 # 커스텀 워크플로우 (비어있음)
│   └── settings.json              # 하네스 설정
├── docs/
│   ├── design-docs/
│   │   ├── adr/                   # 아키텍처 결정 기록
│   │   └── core-beliefs.md        # 핵심 설계 원칙 (직접 작성)
│   ├── exec-plans/
│   │   ├── active/                # 진행 중인 실행 계획 (ep-*.md)
│   │   │   └── verification/      # 스킬 실행 중간 산출물
│   │   └── completed/             # 완료된 계획 히스토리
│   └── product-specs/PRD.md       # 제품 요구사항 문서
├── evals/
│   ├── cases/                     # 스킬별 골든 케이스
│   ├── logs/
│   │   ├── latest.json            # 직전 스킬 실행 결과
│   │   └── history/               # 누적 실행 히스토리
│   ├── scorers/                   # 스킬별 채점 로직 (Python)
│   └── run-evals.py               # 평가 실행기
├── AGENTS.md                      # 에이전트 진입점 + 스킬 호출 레퍼런스
├── ARCHITECTURE.md                # 시스템 아키텍처 (직접 작성)
└── PLANS.md                       # 마스터 로드맵
```

---

## 스킬 파이프라인

### 신규 기능 개발 플로우

각 단계는 이전 단계의 파일 산출물이 존재해야 진입할 수 있습니다.

```
아이디어
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. /skill:deep-interview "아이디어"                                   │
│    소크라테스식 인터뷰 → 수학적 모호도 게이팅 (양방향 채점)            │
│    게이트: 모호도 ≤ 임계값 (settings.json)                            │
│    산출물: docs/product-specs/PRD.md                                 │
│            docs/exec-plans/active/ep-{slug}.md  [Pending Approval]  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ [Pending Approval] 레이블 확인
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. /skill:ralplan docs/exec-plans/active/ep-{slug}.md                │
│    Planner → Architect → Critic 합의 루프 (최대 5회)                 │
│    게이트: Critic "OKAY" 판정 + 인간 승인                             │
│    산출물: verification/stage-*-planner.md                           │
│            verification/stage-*-architect.md                        │
│            verification/stage-*-critic.md                           │
│            ep-{slug}.md  [Pending Approval] (검증 완료)              │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ ralplan 통과 확인
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2.5. /skill:using-git-worktrees                                      │
│      격리 워크스페이스 확보 (소스 수정 발생 전 최후 시점)               │
│      게이트: 베이스라인 테스트 통과 확인                               │
│      산출물: 새 브랜치 + 워크트리 폴더                                 │
│  ※ deep-interview·ralplan은 소스 미수정 → 메인에서 진행 가능          │
│  ※ execute가 첫 소스 수정 → 그 직전에 격리 필요                       │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ 워크트리 격리 확인
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. /skill:execute docs/exec-plans/active/ep-{slug}.md                │
│    Researcher → Planner → ⏸ 인간 승인 게이트 → Implementer          │
│                         → Reviewer → 코드 검토 게이트 → Log          │
│    구현 중 TDD 강제: /skill:test-driven-development (RED→GREEN→REFACTOR) │
│    게이트 ①: 인간 "approved" / "lgtm" 입력                           │
│    게이트 ②: 인간 "lgtm" / "approved" / "signed" 입력               │
│    산출물: verification/research-brief.md                            │
│            verification/implementation-log.md                        │
│            verification/review-report.md  [APPROVED|NEEDS_REVISION] │
│            verification/walkthrough-{slug}.md                        │
│            evals/logs/latest.json                                    │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ Reviewer APPROVED
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. /skill:qa --unit docs/exec-plans/active/ep-{slug}.md              │
│    /skill:qa --e2e  docs/exec-plans/active/ep-{slug}.md              │
│    기존 테스트 프레임워크 자동 감지 → 동적 테스트 생성 → 실행 → 보고  │
│    소스 수정 금지 (테스트 디렉터리만 쓰기 가능)                        │
│    산출물: verification/qa-report-{slug}.md  [QA PASSED|FAILED]      │
│            evals/logs/latest.json                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### 버그 및 장애 대응 플로우 (인터럽트)

어느 단계에서든 예상치 못한 동작이 발생하면 진입합니다.

```
버그 발생 (테스트 실패 / 예외 / 이상 동작 / execute NEEDS_REVISION)
  │
  ▼  ⚠️ 즉각 패치 금지 — 근인 확정 전 코드 수정 절대 금지
┌──────────────────────────────────────────────────────────────────────┐
│ /skill:systematic-debugging "증상 설명"                               │
│ Phase 1: Root Cause Investigation  ← 근인 미확정 시 수정 불가         │
│ Phase 2: Pattern Analysis                                            │
│ Phase 3: Hypothesis & Testing                                        │
│ Phase 4: Implementation  (실패 테스트 먼저, 수정 후)                  │
│ 철칙: 3회 이상 수정 실패 시 아키텍처 재검토 (코드 패치 중단)           │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
           ┌────────────────┼─────────────────┐
           ▼                ▼                 ▼
      코드 수정         구조적 문제         수정 검증
  새 ep-*.md 작성    /skill:ralplan    /skill:qa --unit
  /skill:execute     아키텍처 재검토
```

### 스킬 책임 요약

| 스킬 | 소스 파일 수정 | 게이트 조건 |
|------|:---:|---------|
| `deep-interview` | ❌ | 모호도 ≤ 임계값 |
| `ralplan` | ❌ | Critic OKAY + 인간 승인 |
| `using-git-worktrees` | ❌ | 베이스라인 테스트 통과 |
| `execute` | ✅ Implementer Phase만 | 인간 "approved" 입력 |
| `test-driven-development` | ✅ TDD 사이클 | 실패 테스트 먼저 |
| `qa` | ❌ 테스트 디렉터리만 | ep-*.md 존재 |
| `systematic-debugging` | ✅ Phase 4만 | 근인 확정 |

---

## 스킬 레퍼런스

### deep-interview

```bash
/skill:deep-interview "아이디어"          # 표준 인터뷰
/skill:deep-interview --fresh "아이디어"  # 이전 인터뷰 무시하고 새로 시작
```

인터뷰가 중단된 경우 `--fresh` 없이 재호출하면 `.agents/state.json`을 읽어 이어서 진행합니다.

### ralplan

```bash
/skill:ralplan "태스크 설명"
/skill:ralplan --deliberate "태스크"     # 고위험 변경용 (pre-mortem 포함)
/skill:ralplan --interactive "태스크"    # 중간 체크포인트 활성화
```

### execute

```bash
/skill:execute docs/exec-plans/active/ep-{slug}.md
```

`[Pending Approval]` 레이블이 없는 ep-*.md에는 진입을 거부합니다.

### qa

```bash
/skill:qa --unit docs/exec-plans/active/ep-{slug}.md   # 유닛/통합 테스트
/skill:qa --e2e  docs/exec-plans/active/ep-{slug}.md   # E2E 테스트
/skill:qa --e2e --headed docs/exec-plans/active/ep-{slug}.md  # 브라우저 가시화
```

### systematic-debugging

```bash
/skill:systematic-debugging "증상 설명"
```

---

## Evals (스킬 성능 평가)

각 스킬은 실행 종료 시 `evals/logs/latest.json`에 결과를 기록합니다. 이 로그를 채점하고 누적합니다.

```bash
# 직전 실행 채점
python evals/run-evals.py run --skill deep-interview --project-root ./
python evals/run-evals.py run --skill ralplan --project-root ./
python evals/run-evals.py run --skill execute --project-root ./
python evals/run-evals.py run --skill qa --project-root ./

# 점수 추이 확인 (최근 10회)
python evals/run-evals.py report --last 10

# 마음에 드는 결과를 골든 케이스로 등록
python evals/run-evals.py promote execute "사용자 인증 구현 성공 케이스"
```

골든 케이스는 `evals/cases/{skill}.json`에 누적됩니다. 스킬 프롬프트나 규칙을 수정할 때 회귀 테스트로 활용합니다.

---

## 주요 산출물 파일

| 파일 | 생성 스킬 | 역할 |
|------|---------|------|
| `docs/product-specs/PRD.md` | deep-interview | 요구사항 명세 (모호도 채점 결과 포함) |
| `docs/exec-plans/active/ep-*.md` | deep-interview → ralplan | 실행 계획 (단계별 상태 레이블) |
| `verification/stage-*-*.md` | ralplan | Planner/Architect/Critic 합의 기록 |
| `verification/research-brief.md` | execute | 코드베이스 탐색 결과 + 위험 수준 |
| `verification/implementation-log.md` | execute | 단계별 구현 기록 (Why 중심) |
| `verification/review-report.md` | execute | Reviewer 판정 [APPROVED\|NEEDS_REVISION] |
| `verification/walkthrough-*.md` | execute | 인간 코드 검토 체크리스트 |
| `verification/qa-report-*.md` | qa | 테스트 결과 [QA PASSED\|FAILED] |
| `evals/logs/latest.json` | 모든 스킬 | 직전 실행 구조화 로그 |

---

## Git Worktree (멀티 브랜치 동시 작업)

| 명령 | 설명 |
|------|------|
| `git worktree add <경로> -b <새브랜치명>` | 새 브랜치 + 워크트리 폴더 생성 |
| `git worktree add <경로> <기존브랜치명>` | 기존 브랜치를 워크트리로 불러오기 |
| `git worktree remove <경로>` | 워크트리 제거 |
| `git worktree list` | 워크트리 목록 확인 |

```
root/
├─ project/   ← main 브랜치
└─ feature/   ← 기능 브랜치
```

`cd <경로>`로 폴더를 이동하면 해당 브랜치로 전환됩니다. `git branch` 직접 전환 불필요.

> ⚠️ 멀티 브랜치 동시 작업 시 `PLANS.md` 머지 충돌은 인간 개발자가 수동 해결합니다.

---

## 플러그인

`https://www.skills.sh/`

### caveman

```bash
npx skills add JuliusBrussee/caveman -a antigravity
```

### ponytail

```bash
npx skills add DietrichGebert/ponytail -a antigravity
```
