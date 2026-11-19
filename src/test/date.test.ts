import { describe, expect, it } from 'vitest';
import {
  formatChineseDate,
  formatClockTime,
  formatShortDate,
  isValidDateString,
  relativeDayLabel,
  toDateString,
  todayString,
  weekdayLabel,
} from '../domain/date';

describe('toDateString / todayString', () => {
  it('使用本地年月日，不转 UTC', () => {
    const lateNight = new Date(2026, 10, 19, 23, 50);
    expect(toDateString(lateNight)).toBe('2026-11-19');
    expect(todayString(lateNight)).toBe('2026-11-19');
  });
});

describe('isValidDateString', () => {
  it('接受真实存在的日期', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2026-11-19')).toBe(true);
  });

  it('拒绝格式错误或虚构日期', () => {
    expect(isValidDateString('2026-11-31')).toBe(false);
    expect(isValidDateString('2023-02-29')).toBe(false);
    expect(isValidDateString('2026-1-09')).toBe(false);
    expect(isValidDateString('2026/11/19')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});

describe('展示格式化', () => {
  it('输出中文日期与星期', () => {
    expect(formatChineseDate('2026-11-19')).toBe('2026年11月19日');
    expect(weekdayLabel('2026-11-19')).toBe('星期四');
  });

  it('非法日期原样返回', () => {
    expect(formatChineseDate('not-a-date')).toBe('not-a-date');
    expect(weekdayLabel('not-a-date')).toBe('');
  });

  it('相对今天称呼', () => {
    expect(relativeDayLabel('2026-11-19', '2026-11-19')).toBe('今天');
    expect(relativeDayLabel('2026-11-18', '2026-11-19')).toBe('昨天');
    expect(relativeDayLabel('2026-11-17', '2026-11-19')).toBe('前天');
    expect(relativeDayLabel('2026-11-10', '2026-11-19')).toBe('');
  });

  it('同年省略年份，跨年补全年份', () => {
    expect(formatShortDate('2026-03-08', '2026-11-19')).toBe('3月8日');
    expect(formatShortDate('2025-12-31', '2026-11-19')).toBe('2025年12月31日');
  });

  it('ISO 时间戳转本地时分', () => {
    const iso = new Date(2026, 10, 19, 8, 5).toISOString();
    expect(formatClockTime(iso)).toBe('08:05');
    expect(formatClockTime('bad')).toBe('');
  });
});