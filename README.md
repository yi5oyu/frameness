구조

```
.
├── .agents/
│   ├── rules/
│   │   ├── global.md
│   │   └── persona-qa.md
│   ├── skills/
│   │   ├── deep-interview/
│   │   │   ├── auto-answer-uncertain.md
│   │   │   ├── auto-research-greenfield.md
│   │   │   ├── lateral-review-panel.md
│   │   │   └── SKILL.md
│   │   ├── qa/
│   │   │   └── SKILL.md
│   │   └── ralplan/
│   │       └── SKILL.md
│   └── workflows/
│       └── settings.json
├── docs/
│   ├── design-docs/
│   │   ├── adr/
│   │   └── core-beliefs.md
│   ├── exec-plans/
│   │   ├── active/
│   │   │   └── ep-0000-template.md
│   │   └── completed/
│   ├── product-specs/
│   │   └── PRD.md
│   └── references/
├── evals/
│   ├── cases/
│   ├── logs/
│   └── run-evals.py
├── AGENTS.md
├── ARCHITECTURE.md
└── PLANS.md
```


AGENTS.md

- 기본 운영 규칙 (전역 규칙)
[](https://agents.md/)

PLANS.md

- 실행 계획서 (작업별 실행 계층)

docs/

켄텍스트

exec-plans/

- 실제 일하는 단계를 기록하고 관리하는 동적 폴더
- 실행 중인 계획: ep-*.md (실시간 작업 내용)
- 완료된 계획: ep-done-*.md (완료된 작업 히스토리)
- 에이전트가 직접 수정하고 진행 상황을 기록

worktree

새 브랜치 + 폴더 생성: git worktree add <경로> -b <새브랜치명>
브랜치 워크트리 불러오기: git worktree add <경로> <기존브랜치명>
브랜치 워크트리 제거: git worktree remove <경로>
강제 삭제: git worktree remove <경로> -f
브랜치 워크트리 목록: git worktree list

폴더 구조

```
root/
├─ project(main)
└─ 브랜치_폴더(branch)
```

git branch 필요없이 cd로 폴더 이동하면 브랜치 이전됨


