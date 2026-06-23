import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import fs from 'fs';
import path from 'path';
import { handleInit } from '../commands/init.js';

// Full/Main 모드 실행 전 기존 가드레일 파일이 존재하면 덮어쓰기 여부 확인
async function confirmOverwrite(rl, targetDir, checkFiles) {
    const existing = checkFiles.filter(f => fs.existsSync(path.join(targetDir, f)));
    if (existing.length === 0) return true;

    console.log(`\n⚠️  이미 존재하는 파일이 감지되었습니다: ${existing.join(', ')}`);
    const answer = await rl.question("   덮어쓰기 하시겠습니까? (y/N): ");
    return answer.trim().toLowerCase() === 'y';
}

async function startCli() {
    const rl = readline.createInterface({ input, output });

    console.log("\n=================================");
    console.log("   🪄 Welcome to frameness CLI   ");
    console.log("=================================");
    console.log("1. 🚀 전체 하네스 구성 불러오기 (Full)");
    console.log("2. 📄 주요 가드레일 파일만 불러오기 (Main Files Only)");
    console.log("3. 🧠 에이전트 스킬 세트만 불러오기 (Skills Only)");
    console.log("4. ❌ 종료하기");
    console.log("=================================");

    // 유효한 입력이 들어올 때까지 재시도
    while (true) {
        const choice = await rl.question("\n원하는 작업의 번호를 입력하세요 (1~4): ");
        const targetDir = process.cwd();
        const guardRailFiles = ['AGENTS.md', 'ARCHITECTURE.md', 'PLANS.md'];

        switch (choice.trim()) {
            case '1': {
                const ok = await confirmOverwrite(rl, targetDir, guardRailFiles);
                if (ok) handleInit('full');
                rl.close();
                return;
            }
            case '2': {
                const ok = await confirmOverwrite(rl, targetDir, guardRailFiles);
                if (ok) handleInit('main');
                rl.close();
                return;
            }
            case '3':
                handleInit('skills');
                rl.close();
                return;
            case '4':
                console.log("\n👋 frameness를 종료합니다.");
                rl.close();
                return;
            default:
                console.log("\n❌ 잘못된 번호입니다. 1번부터 4번 사이의 숫자를 입력해 주세요.");
            // 루프 継続 — rl.close() 호출하지 않음
        }
    }
}

startCli();
