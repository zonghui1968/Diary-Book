import { sanitizeAttachments } from './attachments';
import { isFontId, isMoodId, isWeatherId, STORAGE_KEY } from './constants';
import { isValidDateString } from './date';
import { sortEntries } from './factory';
import type { DiaryEntry } from './types';

interface StoredEntryFields {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  font?: unknown;
  mood?: unknown;
  weather?: unknown;
  attachments?: unknown;
}

/** 校验基础字段；字体/心情/附件内容单独清洗，避免坏字段丢整条日记 */
function hasEntryFields(value: unknown): value is StoredEntryFields {
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
 * 读取单条记录：字段齐全时保留；非法字体 / 心情 / 天气 / 坏附件只剥离对应字段，
 * 其他损坏返回 null。
 */
function readEntry(value: unknown): DiaryEntry | null {
  if (!hasEntryFields(value)) {
    return null;
  }
  const entry: DiaryEntry = {
    id: value.id,
    date: value.date,
    title: value.title,
    content: value.content,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
  if (isMoodId(value.mood)) {
    entry.mood = value.mood;
  }
  if (isWeatherId(value.weather)) {
    entry.weather = value.weather;
  }
  if (isFontId(value.font)) {
    entry.font = value.font;
  }
  if (value.attachments !== undefined) {
    entry.attachments = sanitizeAttachments(value.attachments);
  }
  return entry;
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