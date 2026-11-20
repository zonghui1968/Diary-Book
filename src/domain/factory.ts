import { sanitizeAttachments } from './attachments';
import { isFontId, isMoodId, isWeatherId } from './constants';
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
 * 非法字体/心情视为未选；附件统一清洗为数组，便于更新时清空旧附件。
 */
export function normalizeDraft(draft: EntryDraft): EntryDraft {
  return {
    title: draft.title.trim(),
    content: draft.content.replace(/\s+$/, ''),
    font: isFontId(draft.font) ? draft.font : undefined,
    mood: isMoodId(draft.mood) ? draft.mood : undefined,
    weather: isWeatherId(draft.weather) ? draft.weather : undefined,
    attachments: sanitizeAttachments(draft.attachments),
  };
}

/**
 * 同一天只保留一篇：已存在则更新标题/正文/附件并刷新 updatedAt，
 * 不存在则新建并插入到列表最前面。纯函数，不修改入参。
 * 草稿不含 mood 时更新保留原心情；含 null 时删除该字段。
 * 天气与心情同语义：省略保留旧值，null 或非法值清除。
 * 字体按草稿为准，未选字体则清除旧字体。
 */
export function upsertEntry(
  entries: DiaryEntry[],
  date: string,
  draft: EntryDraft,
  nowISO: string,
): DiaryEntry[] {
  const normalized = normalizeDraft(draft);
  const existing = entries.find((entry) => entry.date === date);

  if (existing) {
    return entries.map((entry) => {
      if (entry.date !== date) {
        return entry;
      }
      const next: DiaryEntry = {
        ...entry,
        title: normalized.title,
        content: normalized.content,
        attachments: normalized.attachments,
        updatedAt: nowISO,
      };
      if (normalized.font) {
        next.font = normalized.font;
      } else {
        delete next.font;
      }
      if ('mood' in draft) {
        if (normalized.mood) {
          next.mood = normalized.mood;
        } else {
          delete next.mood;
        }
      }
      if ('weather' in draft) {
        if (normalized.weather) {
          next.weather = normalized.weather;
        } else {
          delete next.weather;
        }
      }
      return next;
    });
  }

  const created: DiaryEntry = {
    id: makeId(),
    date,
    title: normalized.title,
    content: normalized.content,
    attachments: normalized.attachments,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
  if (normalized.font) {
    created.font = normalized.font;
  }
  if (normalized.mood) {
    created.mood = normalized.mood;
  }
  if (normalized.weather) {
    created.weather = normalized.weather;
  }
  return [created, ...entries];
}

/** 按日期倒序排列（最新在前），同日期稳定 */
export function sortEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}