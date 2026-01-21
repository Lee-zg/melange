/**
 * @fileoverview 字符串操作工具
 * @module melange/utils/string
 * @description 提供字符串操作工具，包括
 * 大小写转换、截断和格式化。
 */

/**
 * 将字符串的第一个字母大写。
 *
 * @example
 * ```typescript
 * capitalize('hello'); // 'Hello'
 * capitalize('HELLO'); // 'HELLO'
 * ```
 *
 * @param str - 要大写的字符串
 * @returns 大写后的字符串
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 将字符串转换为驼峰命名法。
 *
 * @example
 * ```typescript
 * camelCase('hello world');   // 'helloWorld'
 * camelCase('hello-world');   // 'helloWorld'
 * camelCase('hello_world');   // 'helloWorld'
 * camelCase('HelloWorld');    // 'helloWorld'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 驼峰命名法字符串
 */
export function camelCase(str: string): string {
  return str
    .replace(/[\s_-]+(.)?/g, (_, char: string | undefined) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * 将字符串转换为帕斯卡命名法。
 *
 * @example
 * ```typescript
 * pascalCase('hello world');   // 'HelloWorld'
 * pascalCase('hello-world');   // 'HelloWorld'
 * pascalCase('hello_world');   // 'HelloWorld'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 帕斯卡命名法字符串
 */
export function pascalCase(str: string): string {
  return capitalize(camelCase(str));
}

/**
 * 将字符串转换为蛇形命名法。
 *
 * @example
 * ```typescript
 * snakeCase('helloWorld');  // 'hello_world'
 * snakeCase('HelloWorld');  // 'hello_world'
 * snakeCase('hello-world'); // 'hello_world'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 蛇形命名法字符串
 */
export function snakeCase(str: string): string {
  return str
    .replace(/[\s-]+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * 将字符串转换为烤肉串命名法。
 *
 * @example
 * ```typescript
 * kebabCase('helloWorld');  // 'hello-world'
 * kebabCase('HelloWorld');  // 'hello-world'
 * kebabCase('hello_world'); // 'hello-world'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 烤肉串命名法字符串
 */
export function kebabCase(str: string): string {
  return str
    .replace(/[\s_]+/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * 将字符串转换为常量命名法。
 *
 * @example
 * ```typescript
 * constantCase('helloWorld');  // 'HELLO_WORLD'
 * constantCase('hello-world'); // 'HELLO_WORLD'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 常量命名法字符串
 */
export function constantCase(str: string): string {
  return snakeCase(str).toUpperCase();
}

/**
 * 将字符串截断到最大长度，必要时添加省略号。
 *
 * @example
 * ```typescript
 * truncate('Hello, World!', 10);       // 'Hello, ...'
 * truncate('Hello', 10);               // 'Hello'
 * truncate('Hello, World!', 10, '…');  // 'Hello, Wo…'
 * ```
 *
 * @param str - 要截断的字符串
 * @param maxLength - 最大长度
 * @param suffix - 要添加的后缀（默认：'...'）
 * @returns 截断后的字符串
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 在字符串左侧填充到最小长度。
 *
 * @example
 * ```typescript
 * padStart('5', 3, '0');  // '005'
 * padStart('42', 3, '0'); // '042'
 * ```
 *
 * @param str - 要填充的字符串
 * @param length - 目标长度
 * @param padChar - 填充字符
 * @returns 填充后的字符串
 */
export function padStart(str: string, length: number, padChar: string = ' '): string {
  if (str.length >= length) return str;
  const padding = padChar.repeat(Math.ceil((length - str.length) / padChar.length));
  return (padding + str).slice(-length);
}

/**
 * 在字符串右侧填充到最小长度。
 *
 * @example
 * ```typescript
 * padEnd('5', 3, '0');  // '500'
 * padEnd('42', 3, '0'); // '420'
 * ```
 *
 * @param str - 要填充的字符串
 * @param length - 目标长度
 * @param padChar - 填充字符
 * @returns 填充后的字符串
 */
export function padEnd(str: string, length: number, padChar: string = ' '): string {
  if (str.length >= length) return str;
  const padding = padChar.repeat(Math.ceil((length - str.length) / padChar.length));
  return (str + padding).slice(0, length);
}

/**
 * 删除前导和尾随空白并折叠多个空格。
 *
 * @example
 * ```typescript
 * collapseWhitespace('  hello   world  '); // 'hello world'
 * ```
 *
 * @param str - 要清理的字符串
 * @returns 清理后的字符串
 */
export function collapseWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * 转义特殊字符以在 HTML 中使用。
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>');
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 *
 * @param str - 要转义的字符串
 * @returns 转义后的字符串
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, char => htmlEntities[char] ?? char);
}

/**
 * 反转义 HTML 实体。
 *
 * @example
 * ```typescript
 * unescapeHtml('&lt;div&gt;Hello&lt;/div&gt;');
 * // '<div>Hello</div>'
 * ```
 *
 * @param str - 要反转义的字符串
 * @returns 反转义后的字符串
 */
export function unescapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  return str.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, entity => htmlEntities[entity] ?? entity);
}

/**
 * 生成指定长度的随机字符串。
 *
 * @example
 * ```typescript
 * randomString(10);        // 'a1b2c3d4e5'
 * randomString(8, 'abc');  // 'abcabcab'
 * ```
 *
 * @param length - 要生成的字符串长度
 * @param chars - 要使用的字符（默认：字母数字）
 * @returns 随机字符串
 */
export function randomString(
  length: number,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 从字符串中提取单词。
 *
 * @example
 * ```typescript
 * words('helloWorld');    // ['hello', 'World']
 * words('hello-world');   // ['hello', 'world']
 * words('hello_world');   // ['hello', 'world']
 * ```
 *
 * @param str - 要提取单词的字符串
 * @returns 单词数组
 */
export function words(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[\s_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0);
}

/**
 * 将字符串转换为标题大小写。
 *
 * @example
 * ```typescript
 * titleCase('hello world'); // 'Hello World'
 * titleCase('the quick brown fox'); // 'The Quick Brown Fox'
 * ```
 *
 * @param str - 要转换的字符串
 * @returns 标题大小写字符串
 */
export function titleCase(str: string): string {
  return words(str)
    .map(word => capitalize(word.toLowerCase()))
    .join(' ');
}

/**
 * 反转字符串。
 *
 * @example
 * ```typescript
 * reverse('hello'); // 'olleh'
 * ```
 *
 * @param str - 要反转的字符串
 * @returns 反转后的字符串
 */
export function reverse(str: string): string {
  return [...str].reverse().join('');
}

/**
 * 计算子字符串的出现次数。
 *
 * @example
 * ```typescript
 * countOccurrences('hello hello hello', 'hello'); // 3
 * ```
 *
 * @param str - 要搜索的字符串
 * @param substr - 要计数的子字符串
 * @returns 出现次数
 */
export function countOccurrences(str: string, substr: string): number {
  if (substr.length === 0) return 0;

  let count = 0;
  let pos = 0;

  while ((pos = str.indexOf(substr, pos)) !== -1) {
    count++;
    pos += substr.length;
  }

  return count;
}
