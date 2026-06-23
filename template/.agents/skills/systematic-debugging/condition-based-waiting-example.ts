/**
 * Condition-Based Waiting — 도메인 특화 헬퍼 구현 예제
 *
 * condition-based-waiting.md에서 참조하는 실제 구현입니다.
 * 임의 타임아웃(setTimeout/sleep) 대신 조건 폴링으로 플레이키 테스트를 제거합니다.
 *
 * 출처: 실제 디버깅 세션 (2025-10-03) — 15개 플레이키 테스트 수정, 통과율 60% → 100%
 */

// ──────────────────────────────────────────────
// 핵심 폴링 유틸리티
// ──────────────────────────────────────────────

/**
 * 조건이 참이 될 때까지 폴링한다.
 *
 * 조건이 timeout 내에 충족되지 않으면 명시적 에러를 던져
 * "무한 대기" 패턴을 방지한다.
 */
export async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result as T;

    // 타임아웃: 무한 루프 방지 + 명확한 실패 메시지
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(
        `Timeout: "${description}" — ${timeoutMs}ms 내에 조건이 충족되지 않았습니다.`
      );
    }

    await new Promise((r) => setTimeout(r, 10)); // 10ms 폴링 간격 (CPU 낭비 방지)
  }
}

// ──────────────────────────────────────────────
// 이벤트 버스용 도메인 특화 헬퍼
// ──────────────────────────────────────────────

export interface AgentEvent {
  type: string;
  sessionId?: string;
  payload?: unknown;
  timestamp: number;
}

/**
 * 특정 타입의 이벤트가 버스에 도착할 때까지 대기한다.
 *
 * ❌ 안티패턴: await new Promise(r => setTimeout(r, 200));
 * ✅ 올바른 방식: await waitForEvent(manager, 'TOOL_STARTED');
 */
export async function waitForEvent(
  events: AgentEvent[],
  type: string,
  timeoutMs = 5000
): Promise<AgentEvent> {
  return waitFor(
    () => events.find((e) => e.type === type),
    `이벤트 타입 "${type}" 수신`,
    timeoutMs
  );
}

/**
 * 특정 타입의 이벤트가 최소 N개 쌓일 때까지 대기한다.
 *
 * 사용 예: 도구가 3번 실행됐음을 확인할 때
 */
export async function waitForEventCount(
  events: AgentEvent[],
  type: string,
  minCount: number,
  timeoutMs = 5000
): Promise<AgentEvent[]> {
  await waitFor(
    () => {
      const matched = events.filter((e) => e.type === type);
      return matched.length >= minCount ? matched : null;
    },
    `이벤트 "${type}" 최소 ${minCount}개 수신`,
    timeoutMs
  );

  return events.filter((e) => e.type === type);
}

/**
 * 조건 함수를 만족하는 이벤트가 도착할 때까지 대기한다.
 *
 * 사용 예: 특정 sessionId를 가진 DONE 이벤트만 기다릴 때
 */
export async function waitForEventMatch(
  events: AgentEvent[],
  predicate: (e: AgentEvent) => boolean,
  description: string,
  timeoutMs = 5000
): Promise<AgentEvent> {
  return waitFor(
    () => events.find(predicate),
    description,
    timeoutMs
  );
}

// ──────────────────────────────────────────────
// 사용 예시 (Jest / Vitest 기준)
// ──────────────────────────────────────────────

/*
describe('Agent session lifecycle', () => {
  it('도구 시작 이벤트를 수신한다', async () => {
    const events: AgentEvent[] = [];
    manager.on('event', (e) => events.push(e));

    manager.startSession();

    // ❌ 제거: await new Promise(r => setTimeout(r, 200));
    // ✅ 조건 기반 대기
    const event = await waitForEvent(events, 'TOOL_STARTED');
    expect(event.type).toBe('TOOL_STARTED');
  });

  it('특정 세션의 완료 이벤트만 기다린다', async () => {
    const events: AgentEvent[] = [];
    const sessionId = 'session-abc';

    manager.on('event', (e) => events.push(e));
    manager.startSession(sessionId);

    const doneEvent = await waitForEventMatch(
      events,
      (e) => e.type === 'DONE' && e.sessionId === sessionId,
      `세션 ${sessionId} 완료`
    );

    expect(doneEvent.sessionId).toBe(sessionId);
  });

  it('임의 타임아웃이 정당화되는 유일한 패턴 — 100ms 간격 도구의 2틱 대기', async () => {
    const events: AgentEvent[] = [];
    manager.on('event', (e) => events.push(e));

    manager.startSession();

    // Step 1: 조건 기반 — 트리거 이벤트 도착 확인
    await waitForEvent(events, 'TOOL_STARTED');

    // Step 2: 임의 타임아웃 — 도구가 100ms 간격으로 동작하므로 2틱(200ms) 관측
    // 이유: 부분 출력 스트리밍 동작을 검증하기 위해 타이밍 자체가 테스트 대상
    await new Promise((r) => setTimeout(r, 200));

    const partialOutputEvents = events.filter((e) => e.type === 'PARTIAL_OUTPUT');
    expect(partialOutputEvents.length).toBeGreaterThanOrEqual(2);
  });
});
*/
