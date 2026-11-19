/* 附件处理 —— 纯函数，不依赖 React / DOM。
 * 所有写入路径（编辑器、草稿规整、localStorage 读取）都经过 sanitizeAttachments，
 * 保证持久化的附件结构始终合法。
 */

import type {
  Attachment,
  ChartAttachment,
  ChartPoint,
  ImageAttachment,
  LinkAttachment,
} from './types';

export const MAX_ATTACHMENTS = 10;
/** 单张图片原始文件上限（字节），面板用 File.size 校验 */
export const MAX_IMAGE_BYTES = 800_000;
/** 全部图片 dataUrl 长度总和上限（估算值） */
export const MAX_TOTAL_IMAGE_BYTES = 1_800_000;
export const MAX_CHART_POINTS = 30;

const IMAGE_PREFIX = 'data:image/';

/** 只接受 http/https 绝对地址，返回规范化 href；其他协议或畸形输入返回 null */
export function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  return url.href;
}

/**
 * 解析「标签,数值」多行文本：支持半角/全角逗号与空白分隔，
 * 空行忽略、非法行跳过，最多 MAX_CHART_POINTS 项。
 */
export function parseChartPoints(raw: string): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (points.length >= MAX_CHART_POINTS) {
      break;
    }
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const tokens = trimmed.split(/[,，\s]+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
      continue;
    }
    const value = Number(tokens[tokens.length - 1]);
    if (!Number.isFinite(value)) {
      continue;
    }
    points.push({
      label: tokens.slice(0, -1).join(' '),
      value,
    });
  }
  return points;
}

function sanitizePoints(value: unknown): ChartPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const points: ChartPoint[] = [];
  for (const item of value) {
    if (points.length >= MAX_CHART_POINTS) {
      break;
    }
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const point = item as Record<string, unknown>;
    if (typeof point.label !== 'string' || typeof point.value !== 'number') {
      continue;
    }
    if (!Number.isFinite(point.value)) {
      continue;
    }
    const label = point.label.trim();
    points.push({ label: label.length > 0 ? label : '未命名', value: point.value });
  }
  return points;
}

function sanitizeImage(value: Record<string, unknown>): ImageAttachment | null {
  if (typeof value.dataUrl !== 'string' || !value.dataUrl.startsWith(IMAGE_PREFIX)) {
    return null;
  }
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  return {
    id: value.id as string,
    kind: 'image',
    name: name.length > 0 ? name : '图片',
    dataUrl: value.dataUrl,
  };
}

function sanitizeLink(value: Record<string, unknown>): LinkAttachment | null {
  if (typeof value.url !== 'string') {
    return null;
  }
  const url = sanitizeUrl(value.url);
  if (url === null) {
    return null;
  }
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  return {
    id: value.id as string,
    kind: 'link',
    title: title.length > 0 ? title : new URL(url).hostname,
    url,
  };
}

function sanitizeChart(value: Record<string, unknown>): ChartAttachment | null {
  if (value.chartType !== 'bar' && value.chartType !== 'line') {
    return null;
  }
  const points = sanitizePoints(value.points);
  if (points.length === 0) {
    return null;
  }
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  return {
    id: value.id as string,
    kind: 'chart',
    chartType: value.chartType,
    title,
    points,
  };
}

/**
 * 清洗未知来源的附件数组：丢弃非法项与重复 id，截断到 MAX_ATTACHMENTS。
 * 返回全新对象，调用方可以安全持久化。
 */
export function sanitizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const attachments: Attachment[] = [];
  const seenIds = new Set<string>();
  for (const item of value) {
    if (attachments.length >= MAX_ATTACHMENTS) {
      break;
    }
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== 'string' || record.id.length === 0) {
      continue;
    }
    if (seenIds.has(record.id)) {
      continue;
    }
    let attachment: Attachment | null = null;
    if (record.kind === 'image') {
      attachment = sanitizeImage(record);
    } else if (record.kind === 'link') {
      attachment = sanitizeLink(record);
    } else if (record.kind === 'chart') {
      attachment = sanitizeChart(record);
    }
    if (attachment === null) {
      continue;
    }
    seenIds.add(attachment.id);
    attachments.push(attachment);
  }
  return attachments;
}

/** 按 dataUrl 长度估算图片总体积 */
export function totalImageBytes(attachments: Attachment[]): number {
  let total = 0;
  for (const attachment of attachments) {
    if (attachment.kind === 'image') {
      total += attachment.dataUrl.length;
    }
  }
  return total;
}

/** 人类可读体积，如 '320 KB' */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${Math.max(0, Math.round(bytes))} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}