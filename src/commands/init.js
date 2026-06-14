import { handleFullMode } from './full.js';
import { handleMainMode } from './main.js';
import { handleSkillsMode } from './skills.js';

export function handleInit(mode = 'full') {
    switch (mode) {
        case 'full':
            handleFullMode();
            break;
        case 'main':
            handleMainMode();
            break;
        case 'skills':
            handleSkillsMode();
            break;
        default:
            console.error("❌ [frameness] 알 수 없는 모드입니다.");
    }
}