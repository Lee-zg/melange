/**
 * @fileoverview 包元数据与导出面测试
 */

import { describe, expect, it } from 'vitest';
import packageJson from '../package.json';
import * as root from '../src';
import * as plugins from '../src/plugins';

describe('Package Metadata', () => {
  it('should keep runtime VERSION aligned with package.json', () => {
    expect(root.VERSION).toBe(packageJson.version);
  });
});

describe('Public Plugin Exports', () => {
  it('should expose documented speech synthesis adapters from plugins entry', () => {
    expect(plugins.GenericSynthesisAdapter).toBeDefined();
    expect(plugins.AzureSynthesisAdapter).toBeDefined();
    expect(plugins.GoogleSynthesisAdapter).toBeDefined();
    expect(plugins.AWSSynthesisAdapter).toBeDefined();
    expect(plugins.XunfeiSynthesisAdapter).toBeDefined();
    expect(plugins.TencentSynthesisAdapter).toBeDefined();
    expect(plugins.BaiduSynthesisAdapter).toBeDefined();
    expect(plugins.AlibabaSynthesisAdapter).toBeDefined();
    expect(plugins.speakWithCloud).toBeDefined();
  });

  it('should expose documented speech recognition adapters from root entry', () => {
    expect(root.GenericAdapter).toBeDefined();
    expect(root.XunfeiAdapter).toBeDefined();
    expect(root.TencentAdapter).toBeDefined();
    expect(root.BaiduAdapter).toBeDefined();
    expect(root.AlibabaAdapter).toBeDefined();
    expect(root.GoogleAdapter).toBeDefined();
    expect(root.AzureAdapter).toBeDefined();
    expect(root.listenWithTimeout).toBeDefined();
  });

  it('should expose documented speech recognition adapters from plugins entry', () => {
    expect(plugins.GenericAdapter).toBeDefined();
    expect(plugins.XunfeiAdapter).toBeDefined();
    expect(plugins.TencentAdapter).toBeDefined();
    expect(plugins.BaiduAdapter).toBeDefined();
    expect(plugins.AlibabaAdapter).toBeDefined();
    expect(plugins.GoogleAdapter).toBeDefined();
    expect(plugins.AzureAdapter).toBeDefined();
    expect(plugins.AudioUtils).toBeDefined();
    expect(plugins.RecognitionStatus).toBeDefined();
    expect(plugins.listenWithTimeout).toBeDefined();
  });
});
