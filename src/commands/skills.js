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

        fs.mkdirSync(targetSkills, { recursive: true });
        fs.cpSync(sourceSkills, targetSkills, { recursive: true, force: true });

        // rules/ 파일: execute·qa·deep-interview·ralplan이 Phase 0에서 명시적으로 읽음
        // 기존 rules/가 없을 때만 설치 (커스텀 규칙 보호)
        const sourceRules = path.join(baseTemplateDir, '.agents/rules');
        const targetRules = path.join(targetDir, '.agents/rules');
        if (fs.existsSync(sourceRules) && !fs.existsSync(targetRules)) {
            fs.mkdirSync(targetRules, { recursive: true });
            fs.cpSync(sourceRules, targetRules, { recursive: true });
            console.log("  ↳ rules/ 동반 설치 (스킬들의 Phase 0 필수 의존성)");
        }

        // settings.json: deep-interview blocking prerequisite
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
