import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { green, red, dim } from '../bridge/ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 계약 + 스킬 + 계획 디렉터리를 한 벌로 설치한다 — 부분 설치는 없다.
// 스킬이 docs/plans/ 와 ep 템플릿을 전제하므로 쪼개면 깨진다.
export function installTemplate(lang = 'en') {
    const templateDir = path.join(__dirname, '../../template', lang);
    const targetDir = process.cwd();

    try {
        fs.cpSync(templateDir, targetDir, { recursive: true, force: true });
        console.log(` ${green('✓')} 설치 완료 ${dim(`(template/${lang})`)}`);
        return true;
    } catch (err) {
        console.error(` ${red('✗')} 설치 오류: ${err.message}`);
        return false;
    }
}
