import { isMoodId } from './constants';
import type { DiaryEntry, EntryDraft } from './types';

/** 生成实体 id；优先用 crypto.randomUUID，降级为时间戳 + 随机串 */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 规整草稿：标题去首尾空白，正文去掉行尾空白但保留内部换行。
 * mood 只保留合法 MoodId，null/undefined/非法值统一为 undefined。
 */
export function normalizeDraft(draft: EntryDraft): EntryDraft {
  return {
    title: draft.title.trim(),
    content: draft.content.replace(/\s+$/, ''),
    mood: isMoodId(draft.mood) ? draft.mood : undefined,
  };
}

/**
 * 同一天只保留一篇：已存在则更新标题/正文并刷新 updatedAt，
 * 不存在则新建并插入到列表最前面。纯函数，不修改入参。
 * 草稿不含 mood 时更新保留原心情；含 null 时删除该字段。
 */
export function upsertEntry(
  entries: DiaryEntry[],
  date: string,
  draft: EntryDraft,
  nowISO: string,
): DiaryEntry[] {
  const { title, content, mood } = normalizeDraft(draft);
  const existing = entries.find((entry) => entry.date === date);

  if (existing) {
    return entries.map((entry) => {
      if (entry.date !== date) {
        return entry;
      }
      const next: DiaryEntry = { ...entry, title, content, updatedAt: nowISO };
      if ('mood' in draft) {
        if (mood) {
          next.mood = mood;
        } else {
          delete next.mood;
        }
      }
      return next;
    });
  }

  const created: DiaryEntry = {
    id: makeId(),
    date,
    title,
    content,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
  if (mood) {
    created.mood = mood;
  }
  return [created, ...entries];
}

/** 按日期倒序排列（最新在前），同日期稳定 */
export function sortEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}