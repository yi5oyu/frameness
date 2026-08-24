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

// Claude Code는 .agents/ 를 읽지 않는다 — 프로젝트 스킬 경로가 .claude/skills/ 뿐이다.
// (Codex·Antigravity는 .agents/skills/ 를 그대로 읽으므로 어댑터가 필요 없다.)
// 정본은 .agents/skills/ 한 벌로 두고, 프론트매터만 그대로 옮긴 포인터를 만든다.
// 본문을 복제하지 않으므로 정본을 고쳐도 어댑터는 손댈 것이 없고,
// 스킬을 추가하면 다음 설치에서 어댑터도 따라온다.
const POINTER = {
    en: (name) =>
        `Read \`.agents/skills/${name}/SKILL.md\` and follow it exactly. That file is canonical.`,
    ko: (name) =>
        `\`.agents/skills/${name}/SKILL.md\`를 읽고 그대로 따른다. 그 파일이 정본이다.`,
};

// 프론트매터는 통째로 옮긴다 — disable-model-invocation 같은 게이트 필드를
// 골라내다 흘리지 않기 위해서다. 필드가 늘어도 여기는 고칠 것이 없다.
function readFrontmatter(file) {
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return m ? m[1] : null;
}

export function writeClaudeAdapters(lang = 'en') {
    const targetDir = process.cwd();
    const skillsDir = path.join(targetDir, '.agents', 'skills');
    const pointer = POINTER[lang] ?? POINTER.en;

    try {
        const names = fs
            .readdirSync(skillsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name)
            .sort();

        let count = 0;
        for (const name of names) {
            const src = path.join(skillsDir, name, 'SKILL.md');
            if (!fs.existsSync(src)) continue;

            const front = readFrontmatter(src);
            if (!front) continue;

            const outDir = path.join(targetDir, '.claude', 'skills', name);
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(
                path.join(outDir, 'SKILL.md'),
                `---\n${front}\n---\n\n${pointer(name)}\n`,
                'utf8'
            );
            count++;
        }

        console.log(
            ` ${green('✓')} Claude Code 어댑터 ${count}개 ${dim('(.claude/skills/ → .agents/skills/)')}`
        );
        return true;
    } catch (err) {
        console.error(` ${red('✗')} 어댑터 생성 오류: ${err.message}`);
        return false;
    }
}
