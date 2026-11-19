const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const WEEKDAYS = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
] as const;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 把 Date 的本地年月日格式化为 'YYYY-MM-DD'（不做 UTC 转换） */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

/** 今天（本地）的日期字符串；时间由调用方注入，便于测试 */
export function todayString(now: Date = new Date()): string {
  return toDateString(now);
}

/**
 * 把 'YYYY-MM-DD' 解析为本地时间当天中午的 Date。
 * 中午可避开夏令时切换导致的跨日偏差；非法日期返回 null。
 */
export function parseDateString(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** 严格校验日期字符串（格式 + 真实存在，如 2023-02-29 为假） */
export function isValidDateString(value: string): boolean {
  return parseDateString(value) !== null;
}

/** 中文日期：2026-11-19 → 2026年11月19日 */
export function formatChineseDate(value: string): string {
  const date = parseDateString(value);
  if (!date) {
    return value;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 星期标签：2026-11-19 → 星期四 */
export function weekdayLabel(value: string): string {
  const date = parseDateString(value);
  return date ? WEEKDAYS[date.getDay()] : '';
}

/** 相对今天的称呼：今天 / 昨天 / 前天 / 空串 */
export function relativeDayLabel(value: string, today: string): string {
  const target = parseDateString(value);
  const base = parseDateString(today);
  if (!target || !base) {
    return '';
  }
  const diff = Math.round((base.getTime() - target.getTime()) / 86400000);
  if (diff === 0) {
    return '今天';
  }
  if (diff === 1) {
    return '昨天';
  }
  if (diff === 2) {
    return '前天';
  }
  return '';
}

/** 列表用短日期：同年显示 'M月D日'，跨年显示 'YYYY年M月D日' */
export function formatShortDate(value: string, today: string): string {
  const date = parseDateString(value);
  const base = parseDateString(today);
  if (!date || !base) {
    return value;
  }
  const prefix = date.getFullYear() === base.getFullYear() ? '' : `${date.getFullYear()}年`;
  return `${prefix}${date.getMonth() + 1}月${date.getDate()}日`;
}

/** ISO 时间戳 → 'HH:MM'（本地时间）；解析失败返回空串 */
export function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}