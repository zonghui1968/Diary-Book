import { sanitizeAttachments } from './attachments';
import { STORAGE_KEY } from './constants';
import { isValidDateString } from './date';
import { sortEntries } from './factory';
import type { DiaryEntry } from './types';

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.date === 'string' &&
    isValidDateString(entry.date) &&
    typeof entry.title === 'string' &&
    typeof entry.content === 'string' &&
    (entry.attachments === undefined || Array.isArray(entry.attachments)) &&
    typeof entry.createdAt === 'string' &&
    typeof entry.updatedAt === 'string'
  );
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
    if (!isDiaryEntry(item) || seenDates.has(item.date)) {
      continue;
    }
    seenDates.add(item.date);
    // 附件坏掉只丢附件，日记本身保留
    entries.push(
      item.attachments === undefined
        ? item
        : { ...item, attachments: sanitizeAttachments(item.attachments) },
    );
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