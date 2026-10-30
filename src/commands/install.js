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

// 사실(명령어·구조·금지)을 루트 AGENTS.md 하나에 둘지 폴더별로 둘지 고른다.
// 두 방식은 루트 AGENTS.md의 규칙 한 줄만 다르다 — 스킬은 "가장 가까운
// AGENTS.md"를 읽으므로 어느 쪽이든 그대로 동작한다. 템플릿은 기본값인
// single 판으로 완결돼 있고, nested를 고르면 그 한 줄만 template/facts/ 의
// 문장으로 바꾼다. single.md는 템플릿의 그 줄과 글자 그대로 같아야 한다.
export function applyFactsLayout(lang = 'en', layout = 'single') {
    if (layout === 'single') {
        console.log(` ${green('✓')} 사실 위치 ${dim('(루트 AGENTS.md 하나)')}`);
        return true;
    }

    const factsDir = path.join(__dirname, '../../template/facts', lang);
    const target = path.join(process.cwd(), 'AGENTS.md');

    try {
        const from = fs.readFileSync(path.join(factsDir, 'single.md'), 'utf8');
        const to = fs.readFileSync(path.join(factsDir, `${layout}.md`), 'utf8');
        const text = fs.readFileSync(target, 'utf8');
        // 템플릿과 조각이 어긋나면 조용히 넘어가지 않는다 — 규칙이 틀린 채 깔린다.
        if (!text.includes(from)) throw new Error(`template/facts/${lang}/single.md 가 AGENTS.md와 다릅니다`);
        fs.writeFileSync(target, text.replace(from, to), 'utf8');
        console.log(` ${green('✓')} 사실 위치 ${dim('(폴더별 AGENTS.md)')}`);
        return true;
    } catch (err) {
        console.error(` ${red('✗')} 규칙 변경 오류: ${err.message}`);
        return false;
    }
}

// git 전략을 고른다. 템플릿은 none 판(지금 브랜치에 커밋)으로 완결돼 있고,
// 전략을 고르면 AGENTS.md 작업 절차 2~5단계만 template/git/{lang}/{strategy}.md
// 로 바꾼다. none.md는 템플릿의 그 단락과 글자 그대로 같아야 한다.
export function applyGitStrategy(lang = 'en', strategy = 'none') {
    if (strategy === 'none') {
        console.log(` ${green('✓')} git 전략 ${dim('(없음 · 지금 브랜치에 커밋)')}`);
        return true;
    }

    const gitDir = path.join(__dirname, '../../template/git', lang);
    const target = path.join(process.cwd(), 'AGENTS.md');

    try {
        const from = fs.readFileSync(path.join(gitDir, 'none.md'), 'utf8');
        const to = fs.readFileSync(path.join(gitDir, `${strategy}.md`), 'utf8');
        const text = fs.readFileSync(target, 'utf8');
        if (!text.includes(from)) throw new Error(`template/git/${lang}/none.md 가 AGENTS.md와 다릅니다`);
        fs.writeFileSync(target, text.replace(from, to), 'utf8');
        console.log(` ${green('✓')} git 전략 ${dim(`(${strategy})`)}`);
        return true;
    } catch (err) {
        console.error(` ${red('✗')} git 전략 적용 오류: ${err.message}`);
        return false;
    }
}

// 스킬 경로는 도구마다 다르다. Codex·Antigravity는 .agents/skills/ 를 프로젝트
// 스킬 경로로 읽지만, Claude Code는 .claude/skills/ 만 읽는다. 템플릿은 언제나
// .agents/ 로 풀린 뒤, 아래 두 함수가 고른 도구에 맞게 자리를 잡는다.

// [Claude Code 전용] .agents/ 는 한 줄도 읽히지 않으므로 남길 이유가 없다.
// 스킬 본문을 .claude/skills/ 로 옮기고 Antigravity 진입점까지 걷어낸다.
// 지우는 것은 설치기가 깐 것뿐이다 — 사용자가 .agents/ 아래 따로 둔 것이
// 있으면 폴더를 비우지 않고 그대로 남긴다.
export function moveSkillsToClaude() {
    const targetDir = process.cwd();
    const agentsDir = path.join(targetDir, '.agents');
    const src = path.join(agentsDir, 'skills');
    const dest = path.join(targetDir, '.claude', 'skills');

    try {
        let count = 0;
        if (fs.existsSync(src)) {
            count = fs
                .readdirSync(src, { withFileTypes: true })
                .filter((e) => e.isDirectory()).length;
            fs.mkdirSync(dest, { recursive: true });
            fs.cpSync(src, dest, { recursive: true, force: true });
            fs.rmSync(src, { recursive: true, force: true });
        }

        // .agents/rules/global.md 는 Antigravity 진입점이다 — Claude Code는
        // CLAUDE.md로 들어오므로 이 어댑터는 쓰이지 않는다.
        fs.rmSync(path.join(agentsDir, 'rules', 'global.md'), { force: true });
        removeIfEmpty(path.join(agentsDir, 'rules'));
        removeIfEmpty(agentsDir);

        // 사용자 파일이 남아 .agents/ 를 못 지운 경우까지 사실대로 알린다.
        const removed = !fs.existsSync(agentsDir);
        console.log(
            ` ${green('✓')} 스킬 ${count}개 → .claude/skills/ ` +
                dim(removed ? '(.agents/ 제거)' : '(.agents/ 는 사용자 파일이 있어 남김)')
        );
        return true;
    } catch (err) {
        console.error(` ${red('✗')} 스킬 이동 오류: ${err.message}`);
        return false;
    }
}

// [함께 사용] 정본은 .agents/skills/ 한 벌로 두고 포인터만 얹는다.
// 프론트매터는 통째로 옮긴다 — disable-model-invocation 같은 게이트 필드를
// 골라내다 흘리지 않기 위해서다. 필드가 늘어도 여기는 고칠 것이 없다.
const POINTER = {
    en: (name) =>
        `Read \`.agents/skills/${name}/SKILL.md\` and follow it exactly. That file is canonical.`,
    ko: (name) =>
        `\`.agents/skills/${name}/SKILL.md\`를 읽고 그대로 따른다. 그 파일이 정본이다.`,
};

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

function readFrontmatter(file) {
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return m ? m[1] : null;
}

function removeIfEmpty(dir) {
    try {
        if (fs.readdirSync(dir).length === 0) fs.rmSync(dir, { recursive: true, force: true });
    } catch {
        // 폴더가 없으면 지울 것도 없다
    }
}
