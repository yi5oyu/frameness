import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseTemplateDir = path.join(__dirname, '../../template');

export function handleSkillsMode() {
    const targetDir = process.cwd();
    console.log("\n🚀 [frameness] 에이전트 스킬 세트만 주입하는 중...");

    try {
        const sourceSkills = path.join(baseTemplateDir, '.agents/skills');
        const targetSkills = path.join(targetDir, '.agents/skills');

        // 목적지에 .agents/skills 폴더가 없다면 안전하게 자동 생성
        fs.mkdirSync(targetSkills, { recursive: true });

        fs.cpSync(sourceSkills, targetSkills, { recursive: true });

        // deep-interview가 settings.json을 blocking prerequisite으로 요구하므로 함께 복사
        const srcSettings = path.join(baseTemplateDir, '.agents/settings.json');
        const destSettings = path.join(targetDir, '.agents/settings.json');
        if (fs.existsSync(srcSettings) && !fs.existsSync(destSettings)) {
            fs.copyFileSync(srcSettings, destSettings);
            console.log("  ↳ settings.json 동반 설치 (deep-interview 필수 의존성)");
        }

        console.log("✅ [frameness] 에이전트 스킬 세트 주입 완료!");
    } catch (err) {
        console.error("❌ [Skills 모드] 작업 중 오류 발생:", err.message);
    }
}