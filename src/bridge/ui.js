// 클로드 코드풍 터미널 UI 헬퍼 — 외부 의존성 없음.
// TTY가 아니거나 NO_COLOR가 설정되면 색·인터랙션 없이 번호 입력으로 폴백한다.
import { stdin, stdout } from 'process';
import readline from 'readline/promises';

const interactive = Boolean(stdout.isTTY && stdin.isTTY);
const colored = interactive && !process.env.NO_COLOR;

const wrap = (code, t) => (colored ? `\x1b[${code}m${t}\x1b[0m` : String(t));
export const dim = (t) => wrap('2', t);
export const bold = (t) => wrap('1', t);
export const accent = (t) => wrap('38;5;209', t);
export const green = (t) => wrap('32', t);
export const red = (t) => wrap('31', t);

// ── 배너 ────────────────────────────────────────────────────────────────
// items: [{ text, style? }] — 폭 계산은 원문 길이로, 스타일은 출력 시에만.
export function banner(items) {
    const w = Math.max(...items.map((i) => i.text.length)) + 4;
    console.log('');
    console.log(dim('╭' + '─'.repeat(w) + '╮'));
    for (const it of items) {
        const pad = ' '.repeat(w - 2 - it.text.length);
        console.log(dim('│') + '  ' + (it.style ? it.style(it.text) : it.text) + pad + dim('│'));
    }
    console.log(dim('╰' + '─'.repeat(w) + '╯'));
}

// ── 키 입력 (raw mode) ──────────────────────────────────────────────────
function readKeys(onKey) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', onKey);
    return () => {
        stdin.off('data', onKey);
        stdin.setRawMode(false);
        stdin.pause();
    };
}

function exitOnCtrlC(key) {
    if (key === '\x03') {
        stdout.write('\n');
        process.exit(130);
    }
}

// ── 선택 ────────────────────────────────────────────────────────────────
// options: [{ label, hint?, value }] → Promise<value>
// ↑/↓(또는 j/k) 이동 · enter 선택 · 숫자 즉시 선택
export async function select(question, options) {
    if (!interactive) return selectFallback(question, options);

    return new Promise((resolve) => {
        let idx = 0;
        const total = options.length + 4; // 질문 + 공백 + 옵션들 + 공백 + 도움말

        const render = (first) => {
            if (!first) stdout.write(`\x1b[${total}A\x1b[J`);
            stdout.write(` ${bold(question)}\n\n`);
            options.forEach((opt, i) => {
                const hint = opt.hint ? '  ' + opt.hint : '';
                if (i === idx) stdout.write(` ${accent('❯')} ${bold(opt.label)}${dim(hint)}\n`);
                else stdout.write(`   ${dim(opt.label + hint)}\n`);
            });
            stdout.write(`\n ${dim('↑/↓ 이동 · enter 선택 · 숫자 즉시 선택')}\n`);
        };

        const finish = (i) => {
            stop();
            stdout.write(`\x1b[${total}A\x1b[J`);
            stdout.write(` ${green('✓')} ${dim(question)}  ${bold(options[i].label)}\n`);
            resolve(options[i].value);
        };

        const stop = readKeys((key) => {
            exitOnCtrlC(key);
            if (key === '\x1b[A' || key === 'k') { idx = (idx - 1 + options.length) % options.length; render(false); }
            else if (key === '\x1b[B' || key === 'j') { idx = (idx + 1) % options.length; render(false); }
            else if (key === '\r' || key === '\n') finish(idx);
            else if (/^[1-9]$/.test(key) && Number(key) <= options.length) finish(Number(key) - 1);
        });

        render(true);
    });
}

// 폴백 입력: readline 하나를 공유하고, 도착한 줄을 큐에 버퍼링한다.
// (질문마다 새 인터페이스를 만들면 파이프된 stdin이 유실되고, rl.question은
//  대기 중인 질문이 없는 순간 도착한 줄을 버린다 — 둘 다 여기서 방지)
let fallbackRl = null;
const lineQueue = [];
const lineWaiters = [];
let stdinClosed = false;

function getFallbackRl() {
    if (!fallbackRl) {
        fallbackRl = readline.createInterface({ input: stdin });
        fallbackRl.on('line', (l) => {
            const waiter = lineWaiters.shift();
            if (waiter) waiter(l);
            else lineQueue.push(l);
        });
        fallbackRl.on('close', () => {
            stdinClosed = true;
            while (lineWaiters.length) lineWaiters.shift()(null);
        });
    }
    return fallbackRl;
}

function askLine(prompt) {
    getFallbackRl();
    stdout.write(prompt);
    if (lineQueue.length) return Promise.resolve(lineQueue.shift());
    if (stdinClosed) return Promise.resolve(null);
    return new Promise((resolve) => lineWaiters.push(resolve));
}

function inputEnded() {
    console.error('\n[frameness] 입력이 끝났습니다 — 설치를 중단합니다.');
    process.exit(1);
}

// CLI 종료 시 호출 — 열려 있는 폴백 readline을 정리해 프로세스가 종료되게 한다.
export function closeUi() {
    if (fallbackRl) {
        fallbackRl.close();
        fallbackRl = null;
    }
}

async function selectFallback(question, options) {
    console.log(`\n ${question}`);
    options.forEach((o, i) => console.log(`   ${i + 1}. ${o.label}${o.hint ? ' — ' + o.hint : ''}`));
    while (true) {
        const answer = await askLine(` 번호 입력 (1-${options.length}): `);
        if (answer === null) inputEnded();
        const n = Number(answer.trim());
        if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1].value;
        console.log(` 1부터 ${options.length} 사이의 숫자를 입력해 주세요.`);
    }
}

// ── 확인 (y/N) ──────────────────────────────────────────────────────────
export async function confirm(question, def = false) {
    if (!interactive) {
        const answer = await askLine(` ${question} ${def ? '(Y/n)' : '(y/N)'}: `);
        if (answer === null) inputEnded();
        const a = answer.trim().toLowerCase();
        return a === '' ? def : a === 'y';
    }

    return new Promise((resolve) => {
        stdout.write(` ${accent('❯')} ${question} ${dim(def ? '(Y/n)' : '(y/N)')} `);
        const stop = readKeys((key) => {
            exitOnCtrlC(key);
            let result = null;
            if (key === 'y' || key === 'Y') result = true;
            else if (key === 'n' || key === 'N') result = false;
            else if (key === '\r' || key === '\n') result = def;
            if (result !== null) {
                stop();
                stdout.write(`\r\x1b[K ${result ? green('✓') : red('✗')} ${dim(question)}  ${bold(result ? 'yes' : 'no')}\n`);
                resolve(result);
            }
        });
    });
}
