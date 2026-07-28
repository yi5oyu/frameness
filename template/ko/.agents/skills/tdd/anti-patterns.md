# tdd 안티패턴 예시

## 구현 결합

```ts
// 나쁨 — 내부 협력자를 목킹한다: 동작이 그대로여도 리팩터링만으로 깨진다
const spy = vi.spyOn(cart as any, "recalculateInternal");
cart.addItem(book);
expect(spy).toHaveBeenCalled();

// 좋음 — seam(공개 인터페이스)에서 관측 가능한 결과를 단언한다
cart.addItem(book);
expect(cart.total()).toBe(12_000);
```

## 동어반복

```ts
// 나쁨 — 코드와 같은 방식으로 기댓값을 계산한다: 코드가 틀려도 통과한다
expect(applyDiscount(price, rate)).toBe(price * (1 - rate));

// 좋음 — 독립된 출처의 구체적 값. 명세: "10,000의 20% 할인 = 8,000"
expect(applyDiscount(10_000, 0.2)).toBe(8_000);
```

## 수평 분할

```
나쁨: 테스트 12개를 쓰고 → 구현 시작   (상상한 동작을 검증하고, 구조를 미리 못박는다)
좋음: 테스트 1 → 구현 1 → 테스트 2 → …  (앞 조각에서 배운 것을 다음 조각에 반영한다)
```
