/**
 * @fileoverview 数组操作工具
 * @module melange/utils/array
 * @description 提供操作数组的工具，包括
 * 分块、扁平化、分组和排序。
 */

/**
 * 将数组拆分为指定大小的块。
 *
 * @example
 * ```typescript
 * chunk([1, 2, 3, 4, 5], 2);
 * // [[1, 2], [3, 4], [5]]
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 要分块的数组
 * @param size - 块大小
 * @returns 块数组
 */
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const result: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

/**
 * 将嵌套数组扁平化一级。
 *
 * @example
 * ```typescript
 * flatten([[1, 2], [3, 4], [5]]);
 * // [1, 2, 3, 4, 5]
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 要扁平化的嵌套数组
 * @returns 扁平化后的数组
 */
export function flatten<T>(array: readonly (T | readonly T[])[]): T[] {
  const result: T[] = [];

  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...item);
    } else {
      result.push(item as T);
    }
  }

  return result;
}

/**
 * 深度扁平化嵌套数组。
 *
 * @example
 * ```typescript
 * flattenDeep([1, [2, [3, [4, 5]]]]);
 * // [1, 2, 3, 4, 5]
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 要扁平化的嵌套数组
 * @returns 深度扁平化后的数组
 */
export function flattenDeep<T>(array: readonly unknown[]): T[] {
  const result: T[] = [];

  function flattenHelper(arr: readonly unknown[]): void {
    for (const item of arr) {
      if (Array.isArray(item)) {
        flattenHelper(item);
      } else {
        result.push(item as T);
      }
    }
  }

  flattenHelper(array);
  return result;
}

/**
 * 返回数组中的唯一元素。
 *
 * @example
 * ```typescript
 * unique([1, 2, 2, 3, 3, 3]);
 * // [1, 2, 3]
 *
 * const users = [{ id: 1 }, { id: 2 }, { id: 1 }];
 * unique(users, u => u.id);
 * // [{ id: 1 }, { id: 2 }]
 * ```
 *
 * @template T - 数组元素类型
 * @template K - 唯一性的键类型
 * @param array - 要去重的数组
 * @param keyFn - 提取比较键的可选函数
 * @returns 包含唯一元素的数组
 */
export function unique<T, K = T>(
  array: readonly T[],
  keyFn?: (item: T) => K
): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }

  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * 按键对数组元素进行分组。
 *
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Alice', age: 25 },
 *   { name: 'Bob', age: 30 },
 *   { name: 'Charlie', age: 25 }
 * ];
 *
 * groupBy(users, u => u.age);
 * // {
 * //   25: [{ name: 'Alice', age: 25 }, { name: 'Charlie', age: 25 }],
 * //   30: [{ name: 'Bob', age: 30 }]
 * // }
 * ```
 *
 * @template T - 数组元素类型
 * @template K - 分组键类型
 * @param array - 要分组的数组
 * @param keyFn - 提取分组键的函数
 * @returns 包含分组元素的对象
 */
export function groupBy<T, K extends string | number | symbol>(
  array: readonly T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

/**
 * 按键对数组进行排序，返回新的排序数组。
 *
 * @example
 * ```typescript
 * const users = [
 *   { name: 'Charlie', age: 25 },
 *   { name: 'Alice', age: 30 },
 *   { name: 'Bob', age: 20 }
 * ];
 *
 * sortBy(users, u => u.age);
 * // 按年龄升序排列
 *
 * sortBy(users, u => u.name, 'desc');
 * // 按姓名降序排列
 * ```
 *
 * @template T - 数组元素类型
 * @template K - 排序键类型
 * @param array - 要排序的数组
 * @param keyFn - 提取排序键的函数
 * @param order - 排序顺序: 'asc' 或 'desc'
 * @returns 新的排序数组
 */
export function sortBy<T, K extends string | number>(
  array: readonly T[],
  keyFn: (item: T) => K,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const multiplier = order === 'asc' ? 1 : -1;

  return [...array].sort((a, b) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);

    if (keyA < keyB) return -1 * multiplier;
    if (keyA > keyB) return 1 * multiplier;
    return 0;
  });
}

/**
 * 根据谓词将数组分区为两个数组。
 *
 * @example
 * ```typescript
 * const [evens, odds] = partition([1, 2, 3, 4, 5], n => n % 2 === 0);
 * // evens = [2, 4], odds = [1, 3, 5]
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 要分区的数组
 * @param predicate - 分区谓词
 * @returns [匹配, 不匹配] 数组的元组
 */
export function partition<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }

  return [pass, fail];
}

/**
 * 将多个数组压缩在一起。
 *
 * @example
 * ```typescript
 * zip([1, 2, 3], ['a', 'b', 'c']);
 * // [[1, 'a'], [2, 'b'], [3, 'c']]
 *
 * zip([1, 2], ['a', 'b', 'c']);
 * // [[1, 'a'], [2, 'b']]
 * ```
 *
 * @template T - 第一个数组元素类型
 * @template U - 第二个数组元素类型
 * @param arr1 - 第一个数组
 * @param arr2 - 第二个数组
 * @returns 元组数组
 */
export function zip<T, U>(
  arr1: readonly T[],
  arr2: readonly U[]
): Array<[T, U]> {
  const length = Math.min(arr1.length, arr2.length);
  const result: Array<[T, U]> = [];

  for (let i = 0; i < length; i++) {
    const first = arr1[i];
    const second = arr2[i];
    if (first !== undefined && second !== undefined) {
      result.push([first, second]);
    }
  }

  return result;
}

/**
 * 返回数组的第一个元素，如果为空则返回 undefined。
 *
 * @example
 * ```typescript
 * first([1, 2, 3]); // 1
 * first([]);        // undefined
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 数组
 * @returns 第一个元素或 undefined
 */
export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}

/**
 * 返回数组的最后一个元素，如果为空则返回 undefined。
 *
 * @example
 * ```typescript
 * last([1, 2, 3]); // 3
 * last([]);        // undefined
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 数组
 * @returns 最后一个元素或 undefined
 */
export function last<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * 从数组中返回随机元素。
 *
 * @example
 * ```typescript
 * sample([1, 2, 3, 4, 5]); // 随机元素
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 数组
 * @returns 随机元素，如果为空则返回 undefined
 */
export function sample<T>(array: readonly T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 随机打乱数组（Fisher-Yates 算法），返回新数组。
 *
 * @example
 * ```typescript
 * shuffle([1, 2, 3, 4, 5]); // 随机打乱
 * ```
 *
 * @template T - 数组元素类型
 * @param array - 要打乱的数组
 * @returns 新的打乱数组
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }

  return result;
}

/**
 * 创建从开始到结束（不包含）的数字数组。
 *
 * @example
 * ```typescript
 * range(5);       // [0, 1, 2, 3, 4]
 * range(1, 5);    // [1, 2, 3, 4]
 * range(0, 10, 2); // [0, 2, 4, 6, 8]
 * ```
 *
 * @param startOrEnd - 如果只有这一个参数，则为结束值；否则为开始值
 * @param end - 结束值（不包含）
 * @param step - 数字之间的步长
 * @returns 数字数组
 */
export function range(startOrEnd: number, end?: number, step: number = 1): number[] {
  let start = 0;
  let finalEnd = startOrEnd;

  if (end !== undefined) {
    start = startOrEnd;
    finalEnd = end;
  }

  if (step === 0) {
    throw new Error('Step cannot be zero');
  }

  const result: number[] = [];

  if (step > 0) {
    for (let i = start; i < finalEnd; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > finalEnd; i += step) {
      result.push(i);
    }
  }

  return result;
}

/**
 * 返回两个数组的交集。
 *
 * @example
 * ```typescript
 * intersection([1, 2, 3], [2, 3, 4]); // [2, 3]
 * ```
 *
 * @template T - 数组元素类型
 * @param arr1 - 第一个数组
 * @param arr2 - 第二个数组
 * @returns 两个数组中存在的元素
 */
export function intersection<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => set2.has(item));
}

/**
 * 返回两个数组的差集（在 arr1 中但不在 arr2 中的元素）。
 *
 * @example
 * ```typescript
 * difference([1, 2, 3], [2, 3, 4]); // [1]
 * ```
 *
 * @template T - 数组元素类型
 * @param arr1 - 第一个数组
 * @param arr2 - 第二个数组
 * @returns 在 arr1 中但不在 arr2 中的元素
 */
export function difference<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => !set2.has(item));
}
