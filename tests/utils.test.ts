/**
 * @fileoverview Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  // Object utilities
  deepClone,
  deepMerge,
  pick,
  omit,
  get,
  set,
  has,
  // Array utilities
  chunk,
  flatten,
  unique,
  groupBy,
  sortBy,
  partition,
  zip,
  range,
  // String utilities
  capitalize,
  camelCase,
  snakeCase,
  kebabCase,
  truncate,
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isNil,
  isEmpty,
  isEmail,
  isUUID,
  isURL,
} from '../src/utils';

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(null)).toBe(null);
    });

    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.b).not.toBe(original.b);
    });

    it('should deep clone arrays', () => {
      const original = [1, [2, 3], { a: 4 }];
      const clone = deepClone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone[1]).not.toBe(original[1]);
    });

    it('should clone Date objects', () => {
      const date = new Date('2023-01-01');
      const clone = deepClone(date);

      expect(clone.getTime()).toBe(date.getTime());
      expect(clone).not.toBe(date);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const base = { a: 1, b: { c: 2, d: 3 } };
      const override = { b: { c: 4 } };
      const merged = deepMerge(base, override);

      expect(merged).toEqual({ a: 1, b: { c: 4, d: 3 } });
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });
  });

  describe('get', () => {
    it('should get nested values', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(get(obj, 'a.b.c')).toBe(42);
    });

    it('should return default for missing paths', () => {
      const obj = { a: 1 };
      expect(get(obj, 'x.y.z', 'default')).toBe('default');
    });
  });

  describe('set', () => {
    it('should set nested values', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.c.d', 42);
      expect(obj).toEqual({ a: { b: 1, c: { d: 42 } } });
    });
  });

  describe('has', () => {
    it('should check for nested paths', () => {
      const obj = { a: { b: { c: 1 } } };
      expect(has(obj, 'a.b.c')).toBe(true);
      expect(has(obj, 'a.x')).toBe(false);
    });
  });
});

describe('Array Utilities', () => {
  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should throw for non-positive size', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow();
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays by one level', () => {
      expect(flatten([[1, 2], [3, 4], 5])).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should use key function for uniqueness', () => {
      const users = [{ id: 1 }, { id: 2 }, { id: 1 }];
      expect(unique(users, u => u.id)).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('groupBy', () => {
    it('should group elements by key', () => {
      const users = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 25 },
      ];

      const grouped = groupBy(users, u => u.age);
      expect(grouped[25]).toHaveLength(2);
      expect(grouped[30]).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort by key ascending', () => {
      const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
      const sorted = sortBy(items, x => x.n);
      expect(sorted.map(x => x.n)).toEqual([1, 2, 3]);
    });

    it('should sort descending', () => {
      const items = [{ n: 1 }, { n: 3 }, { n: 2 }];
      const sorted = sortBy(items, x => x.n, 'desc');
      expect(sorted.map(x => x.n)).toEqual([3, 2, 1]);
    });
  });

  describe('partition', () => {
    it('should split array by predicate', () => {
      const [evens, odds] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
      expect(evens).toEqual([2, 4]);
      expect(odds).toEqual([1, 3, 5]);
    });
  });

  describe('zip', () => {
    it('should zip two arrays', () => {
      expect(zip([1, 2, 3], ['a', 'b', 'c'])).toEqual([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
      ]);
    });

    it('should handle different lengths', () => {
      expect(zip([1, 2], ['a', 'b', 'c'])).toEqual([
        [1, 'a'],
        [2, 'b'],
      ]);
    });
  });

  describe('range', () => {
    it('should create range from 0', () => {
      expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    });

    it('should create range with start and end', () => {
      expect(range(1, 5)).toEqual([1, 2, 3, 4]);
    });

    it('should support step', () => {
      expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    });
  });
});

describe('String Utilities', () => {
  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('')).toBe('');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(snakeCase('helloWorld')).toBe('hello_world');
      expect(snakeCase('HelloWorld')).toBe('hello_world');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('helloWorld')).toBe('hello-world');
      expect(kebabCase('hello_world')).toBe('hello-world');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello, World!', 10)).toBe('Hello, ...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
  });
});

describe('Type Guards', () => {
  describe('isString', () => {
    it('should identify strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString(123)).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should identify numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber('123')).toBe(false);
    });
  });

  describe('isBoolean', () => {
    it('should identify booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(0)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should identify plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should identify arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2])).toBe(true);
      expect(isArray({})).toBe(false);
    });
  });

  describe('isNil', () => {
    it('should identify null and undefined', () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
      expect(isNil(0)).toBe(false);
      expect(isNil('')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should identify empty values', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1])).toBe(false);
    });
  });
});

describe('Validation Utilities', () => {
  describe('isEmail', () => {
    it('should validate email addresses', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('not-an-email')).toBe(false);
    });
  });

  describe('isUUID', () => {
    it('should validate UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('not-a-uuid')).toBe(false);
    });
  });

  describe('isURL', () => {
    it('should validate URLs', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://localhost:3000')).toBe(true);
      expect(isURL('not-a-url')).toBe(false);
    });
  });
});
