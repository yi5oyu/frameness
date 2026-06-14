import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseTemplateDir = path.join(__dirname, '../../../template');

export function handleSkillsMode() {
    const targetDir = process.cwd();
    console.log("\n🚀 [frameness] 에이전트 스킬 세트만 주입하는 중...");

    try {
        const sourceSkills = path.join(baseTemplateDir, '.agents/skills');
        const targetSkills = path.join(targetDir, '.agents/skills');

        // 목적지에 .agents/skills 폴더가 없다면 안전하게 자동 생성
        fs.mkdirSync(targetSkills, { recursive: true });

        fs.cpSync(sourceSkills, targetSkills, { recursive: true });
        console.log("✅ [frameness] 에이전트 스킬 세트 주입 완료!");
    } catch (err) {
        console.error("❌ [Skills 모드] 작업 중 오류 발생:", err.message);
    }
}