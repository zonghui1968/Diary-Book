import { isMoodId, STORAGE_KEY } from './constants';
import { isValidDateString } from './date';
import { sortEntries } from './factory';
import type { DiaryEntry } from './types';

/** 基础字段校验，不含 mood */
function hasEntryFields(entry: Record<string, unknown>): boolean {
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.date === 'string' &&
    isValidDateString(entry.date) &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    typeof entry.createdAt === 'string' &&
    typeof entry.updatedAt === 'string'
  );
}

/** mood 缺失合法；存在时必须是 MoodId */
function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return hasEntryFields(entry) && (entry.mood === undefined || isMoodId(entry.mood));
}

/**
 * 读取单条记录：字段齐全但 mood 非法时剥离 mood 保留日记，
 * 其他损坏一律返回 null。
 */
function readEntry(value: unknown): DiaryEntry | null {
  if (isDiaryEntry(value)) {
    return value;
  }
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  if (!hasEntryFields(entry)) {
    return null;
  }
  const rest = { ...entry };
  delete rest.mood;
  return rest as unknown as DiaryEntry;
}

/**
 * 读取日记。任何损坏、缺字段、非法日期的记录都会被静默丢弃；
 * 同一天出现多条时只保留第一条（写入时已按日期倒序）。
 */
export function loadEntries(storage: Storage): DiaryEntry[] {
  let parsed: unknown;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  let list: unknown[] = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (typeof parsed === 'object' && parsed !== null && 'entries' in parsed) {
    if (Array.isArray(parsed.entries)) {
      list = parsed.entries;
    }
  }

  const seenDates = new Set<string>();
  const entries: DiaryEntry[] = [];
  for (const item of list) {
    const entry = readEntry(item);
    if (!entry || seenDates.has(entry.date)) {
      continue;
    }
    seenDates.add(entry.date);
    entries.push(entry);
  }
  return sortEntries(entries);
}

/** 写入日记；存储不可用或超出配额时返回 false，由调用方决定如何提示 */
export function saveEntries(storage: Storage, entries: DiaryEntry[]): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries }));
    return true;
  } catch {
    return false;
  }
}