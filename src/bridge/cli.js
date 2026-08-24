import fs from 'fs';
import path from 'path';
import { installTemplate, writeClaudeAdapters } from '../commands/install.js';
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
        { label: 'English', value: 'en' },
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

    // 스킬 정본은 .agents/skills/ 다 — Codex·Antigravity는 이 경로를 그대로 읽는다.
    // Claude Code만 .claude/skills/ 를 보므로 쓰는 사람만 어댑터를 얹는다.
    const withClaude = await confirm(
        'Claude Code를 함께 쓰나요? (.claude/skills/ 어댑터 생성)',
        true
    );

    console.log('');
    if (!installTemplate(lang)) return;
    if (withClaude) writeClaudeAdapters(lang);

    console.log('');
    console.log(` ${dim('다음 단계:')}`);
    console.log(`   ${dim('1. setup — 스택·폴더 구조를 정하고 폴더별 AGENTS.md 생성')}`);
    console.log(`   ${dim('2. plan 또는 execute — 첫 작업 시작')}`);
    console.log('');
}

startCli().finally(closeUi);
