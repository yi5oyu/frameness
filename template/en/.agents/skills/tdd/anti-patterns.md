# tdd anti-pattern examples

## Implementation coupling

```ts
// wrong — mocks an internal collaborator: refactoring breaks it even when behavior is unchanged
const spy = vi.spyOn(cart as any, "recalculateInternal");
cart.addItem(book);
expect(spy).toHaveBeenCalled();

// right — assert the observable result at the seam (public interface)
cart.addItem(book);
expect(cart.total()).toBe(12_000);
```

## Tautology

```ts
// wrong — computes the expectation the way the code does: passes even when the code is wrong
expect(applyDiscount(price, rate)).toBe(price * (1 - rate));

// right — concrete value from an independent source. Spec: "20% off 10,000 = 8,000"
expect(applyDiscount(10_000, 0.2)).toBe(8_000);
```

## Horizontal slicing

```
wrong: write 12 tests → start implementing  (verifies imagined behavior, pre-commits to a structure)
right: test 1 → impl 1 → test 2 → …         (each slice applies what the previous one taught)
```
