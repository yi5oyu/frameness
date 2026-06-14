import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseTemplateDir = path.join(__dirname, '../../../template');

export function handleFullMode() {
    const targetDir = process.cwd();
    console.log("\n🚀 [frameness] 전체 하네스 패키지를 설치하는 중...");

    try {
        fs.cpSync(baseTemplateDir, targetDir, { recursive: true });
        console.log("✅ [frameness] 전체 하네스 구조 구축 완료!");
    } catch (err) {
        console.error("❌ [Full 모드] 작업 중 오류 발생:", err.message);
    }
}