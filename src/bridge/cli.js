import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { handleInit } from '../commands/init.js';

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

    const choice = await rl.question("\n원하는 작업의 번호를 입력하세요 (1~4): ");
    rl.close();

    switch (choice.trim()) {
        case '1':
            handleInit('full');
            break;
        case '2':
            handleInit('main');
            break;
        case '3':
            handleInit('skills');
            break;
        case '4':
            console.log("\n👋 frameness를 종료합니다.");
            break;
        default:
            console.log("\n❌ 잘못된 번호입니다. 1번부터 4번 사이의 숫자를 입력해 주세요.");
            break;
    }
}

startCli();