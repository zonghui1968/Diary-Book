import { describe, expect, it } from 'vitest';
import {
  MAX_ATTACHMENTS,
  MAX_CHART_POINTS,
  formatBytes,
  parseChartPoints,
  sanitizeAttachments,
  sanitizeUrl,
  totalImageBytes,
} from '../domain/attachments';
import type { Attachment } from '../domain/types';

const PNG_DATA_URL = 'data:image/png;base64,AAAA';

describe('sanitizeUrl', () => {
  it('接受 http 与 https 并返回规范化地址', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('  http://example.com/a?b=1  ')).toBe(
      'http://example.com/a?b=1',
    );
  });

  it('拒绝非 http/https 协议与畸形输入', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,hello')).toBeNull();
    expect(sanitizeUrl('file:///C:/secret.txt')).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl('   ')).toBeNull();
    expect(sanitizeUrl('example.com')).toBeNull();
    expect(sanitizeUrl('http://[')).toBeNull();
  });
});

describe('parseChartPoints', () => {
  it('解析逗号分隔的标签与数值', () => {
    expect(parseChartPoints('周一,3\n周二,5')).toEqual([
      { label: '周一', value: 3 },
      { label: '周二', value: 5 },
    ]);
  });

  it('接受全角逗号与空格分隔、负数和小数', () => {
    expect(parseChartPoints('周一，3\n周二 4.5\n周三,-2')).toEqual([
      { label: '周一', value: 3 },
      { label: '周二', value: 4.5 },
      { label: '周三', value: -2 },
    ]);
  });

  it('忽略空行并跳过非法行', () => {
    expect(parseChartPoints('\n周一,abc\n\n周二,5\n只有标签\n')).toEqual([
      { label: '周二', value: 5 },
    ]);
    expect(parseChartPoints('')).toEqual([]);
  });

  it('最多保留 30 项', () => {
    const raw = Array.from({ length: 40 }, (_, index) => `第${index}项,${index}`).join(
      '\n',
    );
    expect(parseChartPoints(raw)).toHaveLength(MAX_CHART_POINTS);
  });
});

describe('sanitizeAttachments', () => {
  it('过滤非法项并清洗合法项', () => {
    const input: unknown[] = [
      { id: 'img-1', kind: 'image', name: '照片', dataUrl: PNG_DATA_URL },
      { id: 'img-bad', kind: 'image', name: '坏图', dataUrl: 'https://evil/x.png' },
      { id: 'link-1', kind: 'link', title: '', url: 'https://example.com' },
      { id: 'link-bad', kind: 'link', title: '坏', url: 'javascript:alert(1)' },
      {
        id: 'chart-1',
        kind: 'chart',
        chartType: 'line',
        title: '趋势',
        points: [{ label: '一', value: 1 }, { label: '坏', value: Number.NaN }],
      },
      { id: 'chart-bad', kind: 'chart', chartType: 'bar', title: '', points: [] },
      { id: 'unknown', kind: 'video' },
      { kind: 'link', title: '无 id', url: 'https://example.com' },
      null,
    ];

    expect(sanitizeAttachments(input)).toEqual([
      { id: 'img-1', kind: 'image', name: '照片', dataUrl: PNG_DATA_URL },
      { id: 'link-1', kind: 'link', title: 'example.com', url: 'https://example.com/' },
      {
        id: 'chart-1',
        kind: 'chart',
        chartType: 'line',
        title: '趋势',
        points: [{ label: '一', value: 1 }],
      },
    ]);
  });

  it('去重 id 并截断到数量上限', () => {
    const links = Array.from({ length: MAX_ATTACHMENTS + 5 }, (_, index) => ({
      id: `link-${index}`,
      kind: 'link',
      title: `链接 ${index}`,
      url: `https://example.com/${index}`,
    }));
    const withDuplicate = [
      ...links,
      { id: 'link-0', kind: 'link', title: '重复', url: 'https://example.com/dup' },
    ];

    const sanitized = sanitizeAttachments(withDuplicate);
    expect(sanitized).toHaveLength(MAX_ATTACHMENTS);
    expect(new Set(sanitized.map((item) => item.id)).size).toBe(MAX_ATTACHMENTS);
    expect(sanitized.some((item) => item.id === 'link-0' && item.kind === 'link' && item.title === '链接 0')).toBe(true);
  });

  it('非数组返回空数组', () => {
    expect(sanitizeAttachments(undefined)).toEqual([]);
    expect(sanitizeAttachments('nope')).toEqual([]);
  });
});

describe('体积辅助', () => {
  it('只累计图片 dataUrl 长度', () => {
    const attachments: Attachment[] = [
      { id: 'img', kind: 'image', name: '图', dataUrl: PNG_DATA_URL },
      { id: 'link', kind: 'link', title: '站点', url: 'https://example.com/' },
    ];
    expect(totalImageBytes(attachments)).toBe(PNG_DATA_URL.length);
  });

  it('格式化字节数', () => {
    expect(formatBytes(320 * 1024)).toBe('320 KB');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});