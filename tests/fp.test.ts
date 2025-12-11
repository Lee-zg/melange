/**
 * @fileoverview Tests for functional programming utilities
 */

import { describe, it, expect } from 'vitest';
import {
  pipe,
  compose,
  flow,
  curry,
  uncurry,
  partial,
  ok,
  err,
  isOk,
  isErr,
  mapResult,
  unwrapOr,
  some,
  none,
  isSome,
  isNone,
  mapOption,
  getOrElse,
  memoize,
  once,
  identity,
  constant,
  noop,
  not,
} from '../src/fp';

describe('Function Composition', () => {
  const addOne = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const square = (x: number) => x * x;

  describe('pipe', () => {
    it('should pipe functions left to right', () => {
      const piped = pipe(addOne, double, square);
      expect(piped(2)).toBe(36); // ((2 + 1) * 2)² = 36
    });

    it('should return identity for no functions', () => {
      const piped = pipe();
      expect(piped(5)).toBe(5);
    });

    it('should work with single function', () => {
      const piped = pipe(addOne);
      expect(piped(5)).toBe(6);
    });
  });

  describe('compose', () => {
    it('should compose functions right to left', () => {
      const composed = compose(square, double, addOne);
      expect(composed(2)).toBe(36); // ((2 + 1) * 2)² = 36
    });
  });

  describe('flow', () => {
    it('should apply functions to a value', () => {
      const result = flow(2, addOne, double, square);
      expect(result).toBe(36);
    });

    it('should return value unchanged with no functions', () => {
      const result = flow(5);
      expect(result).toBe(5);
    });
  });
});

describe('Currying', () => {
  describe('curry', () => {
    it('should curry a binary function', () => {
      const add = (a: number, b: number) => a + b;
      const curriedAdd = curry(add);

      expect(curriedAdd(1)(2)).toBe(3);
      expect(curriedAdd(5)(10)).toBe(15);
    });

    it('should allow partial application', () => {
      const add = (a: number, b: number) => a + b;
      const curriedAdd = curry(add);
      const addFive = curriedAdd(5);

      expect(addFive(3)).toBe(8);
      expect(addFive(10)).toBe(15);
    });
  });

  describe('uncurry', () => {
    it('should uncurry a curried function', () => {
      const curriedAdd = (a: number) => (b: number) => a + b;
      const add = uncurry(curriedAdd);

      expect(add(1, 2)).toBe(3);
    });
  });

  describe('partial', () => {
    it('should partially apply arguments', () => {
      const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
      const sayHello = partial(greet, 'Hello');

      expect(sayHello('World')).toBe('Hello, World!');
    });
  });
});

describe('Result Type', () => {
  describe('ok and err', () => {
    it('should create Ok result', () => {
      const result = ok(42);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });

    it('should create Err result', () => {
      const result = err('error');
      expect(result._tag).toBe('Err');
      expect(result.error).toBe('error');
    });
  });

  describe('isOk and isErr', () => {
    it('should correctly identify Ok', () => {
      expect(isOk(ok(42))).toBe(true);
      expect(isOk(err('error'))).toBe(false);
    });

    it('should correctly identify Err', () => {
      expect(isErr(err('error'))).toBe(true);
      expect(isErr(ok(42))).toBe(false);
    });
  });

  describe('mapResult', () => {
    it('should map over Ok value', () => {
      const result = mapResult(ok(5), x => x * 2);
      expect(isOk(result) && result.value).toBe(10);
    });

    it('should pass through Err', () => {
      const result = mapResult(err('error'), (x: number) => x * 2);
      expect(isErr(result) && result.error).toBe('error');
    });
  });

  describe('unwrapOr', () => {
    it('should unwrap Ok value', () => {
      expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('should return default for Err', () => {
      expect(unwrapOr(err('error'), 0)).toBe(0);
    });
  });
});

describe('Option Type', () => {
  describe('some and none', () => {
    it('should create Some option', () => {
      const option = some(42);
      expect(option._tag).toBe('Some');
      expect(option.value).toBe(42);
    });

    it('should create None option', () => {
      const option = none();
      expect(option._tag).toBe('None');
    });
  });

  describe('isSome and isNone', () => {
    it('should correctly identify Some', () => {
      expect(isSome(some(42))).toBe(true);
      expect(isSome(none())).toBe(false);
    });

    it('should correctly identify None', () => {
      expect(isNone(none())).toBe(true);
      expect(isNone(some(42))).toBe(false);
    });
  });

  describe('mapOption', () => {
    it('should map over Some value', () => {
      const option = mapOption(some(5), x => x * 2);
      expect(isSome(option) && option.value).toBe(10);
    });

    it('should pass through None', () => {
      const option = mapOption(none(), (x: number) => x * 2);
      expect(isNone(option)).toBe(true);
    });
  });

  describe('getOrElse', () => {
    it('should get Some value', () => {
      expect(getOrElse(some(42), 0)).toBe(42);
    });

    it('should return default for None', () => {
      expect(getOrElse(none(), 0)).toBe(0);
    });
  });
});

describe('Higher-Order Functions', () => {
  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const expensive = memoize((n: number) => {
        callCount++;
        return n * 2;
      });

      expect(expensive(5)).toBe(10);
      expect(expensive(5)).toBe(10);
      expect(callCount).toBe(1);

      expect(expensive(3)).toBe(6);
      expect(callCount).toBe(2);
    });
  });

  describe('once', () => {
    it('should only call function once', () => {
      let callCount = 0;
      const initialize = once(() => {
        callCount++;
        return 'initialized';
      });

      expect(initialize()).toBe('initialized');
      expect(initialize()).toBe('initialized');
      expect(callCount).toBe(1);
    });
  });

  describe('identity', () => {
    it('should return input unchanged', () => {
      expect(identity(42)).toBe(42);
      expect(identity('hello')).toBe('hello');
      const obj = { a: 1 };
      expect(identity(obj)).toBe(obj);
    });
  });

  describe('constant', () => {
    it('should always return the same value', () => {
      const alwaysFive = constant(5);
      expect(alwaysFive()).toBe(5);
      expect(alwaysFive()).toBe(5);
    });
  });

  describe('noop', () => {
    it('should do nothing and return undefined', () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe('not', () => {
    it('should negate a predicate', () => {
      const isEven = (n: number) => n % 2 === 0;
      const isOdd = not(isEven);

      expect(isOdd(3)).toBe(true);
      expect(isOdd(4)).toBe(false);
    });
  });
});
