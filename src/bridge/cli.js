import fs from 'fs';
import path from 'path';
import {
    installTemplate,
    applyFactsLayout,
    moveSkillsToClaude,
    writeClaudeAdapters,
} from '../commands/install.js';
import { banner, select, confirm, closeUi, dim, bold } from './ui.js';

async function startCli() {
    const pkg = JSON.parse(
        fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    );

    banner([
        { text: 'frameness', style: bold },
        { text: `AI agent harness installer · v${pkg.version}`, style: dim },
    ]);
    console.log(` ${dim('cwd')} ${process.cwd()}\n`);

    // 두 판은 1:1 대응. ep 섹션명·상태 레이블 등 기계 표면은 양쪽 공통 영어다.
    const lang = await select('템플릿 언어 (template language)', [
        { label: 'English', hint: 'default', value: 'en' },
        { label: '한국어', value: 'ko' },
        { label: 'Exit', hint: '종료', value: 'exit' },
    ]);

    if (lang === 'exit') {
        console.log(`\n ${dim('frameness를 종료합니다.')}\n`);
        return;
    }

    // 기존 계약 보호 — 덮어쓰기 전 확인
    const targetDir = process.cwd();
    const existing = ['AGENTS.md', 'CLAUDE.md'].filter((f) =>
        fs.existsSync(path.join(targetDir, f))
    );
    if (existing.length > 0) {
        const ok = await confirm(`이미 존재: ${existing.join(', ')} — 덮어쓸까요?`, false);
        if (!ok) {
            console.log(`\n ${dim('설치를 건너뜁니다.')}\n`);
            return;
        }
    }

    // 스킬 경로가 도구마다 다르다 — 쓰는 도구의 자리에만 스킬을 둔다.
    const tool = await select('사용하는 AI 코딩 도구', [
        { label: 'Claude Code', hint: '.claude/skills/', value: 'claude' },
        { label: 'Codex · Antigravity 등', hint: '.agents/skills/', value: 'agents' },
        { label: '함께 사용', hint: '.agents/skills/ + 어댑터', value: 'both' },
    ]);

    // 하위 프로젝트가 있어도 AGENTS.md를 폴더마다 두지 않는 팀이 있다.
    // 첫 항목이 기본값이다 — 템플릿도 single 판으로 들어 있다.
    const layout = await select('프로젝트 사실(명령어·구조·금지)을 둘 곳', [
        { label: '루트 AGENTS.md 하나', hint: '하위 AGENTS.md 없음 · 기본', value: 'single' },
        { label: '폴더별 AGENTS.md', hint: '하위 프로젝트마다 하나', value: 'nested' },
    ]);

    console.log('');
    if (!installTemplate(lang)) return;
    if (!applyFactsLayout(lang, layout)) return;
    if (tool === 'claude') moveSkillsToClaude();
    if (tool === 'both') writeClaudeAdapters(lang);

    console.log('');
    console.log(` ${dim('다음 단계:')}`);
    console.log(
        `   ${dim(`1. setup — 스택·폴더 구조를 정하고 ${layout === 'single' ? '루트 AGENTS.md에 기록' : '폴더별 AGENTS.md 생성'}`)}`
    );
    console.log(`   ${dim('2. plan 또는 execute — 첫 작업 시작')}`);
    console.log('');
}

startCli().finally(closeUi);
