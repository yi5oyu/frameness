import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseTemplateDir = path.join(__dirname, '../../../template');

export function handleMainMode() {
    const targetDir = process.cwd();
    console.log("\n🚀 [frameness] 주요 가드레일 파일만 생성 중...");

    try {
        const mainFiles = ['AGENTS.md', 'ARCHITECTURE.md', 'PLANS.md'];

        mainFiles.forEach(file => {
            const srcFile = path.join(baseTemplateDir, file);
            const destFile = path.join(targetDir, file);

            if (fs.existsSync(srcFile)) {
                fs.copyFileSync(srcFile, destFile);
            }
        });
        console.log("✅ [frameness] 주요 가드레일 파일 생성 완료!");
    } catch (err) {
        console.error("❌ [Main 모드] 작업 중 오류 발생:", err.message);
    }
}