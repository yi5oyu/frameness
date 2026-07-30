# tdd 안티패턴 예시

## 구현 결합

```ts
// 잘못 — 내부 협력자를 모킹: 리팩터링하면 동작이 같아도 깨진다
const spy = vi.spyOn(cart as any, "recalculateInternal");
cart.addItem(book);
expect(spy).toHaveBeenCalled();

// 올바름 — seam(공개 인터페이스)의 관찰 가능한 결과를 검증
cart.addItem(book);
expect(cart.total()).toBe(12_000);
```

## 동어반복

```ts
// 잘못 — 기대값을 코드와 같은 방식으로 계산: 코드가 틀려도 통과한다
expect(applyDiscount(price, rate)).toBe(price * (1 - rate));

// 올바름 — 독립 출처의 구체 값. 스펙: "10,000원에 20% 할인 = 8,000원"
expect(applyDiscount(10_000, 0.2)).toBe(8_000);
```

## 수평 슬라이싱

```
잘못:   테스트 12개 작성 → 구현 시작       (상상한 동작을 검증, 구조에 선커밋)
올바름: 테스트 1 → 구현 1 → 테스트 2 → …  (각 slice가 직전 slice에서 배운 것을 반영)
```
