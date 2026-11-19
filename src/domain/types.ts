/* 日记本数据协议 —— 基础版 v1.0
 * 每条日记对应一个本地日期（YYYY-MM-DD），同一天只保留一条记录。
 * 扩展字段一律声明为可选，保证旧数据可直接反序列化。
 */

/** 当天心情，emoji 由 UI 层映射 */
export type MoodId =
  | 'happy'
  | 'calm'
  | 'loved'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'tired';

/** 一篇日记（持久化形态） */
export interface DiaryEntry {
  id: string;
  /** 本地日期，格式 'YYYY-MM-DD'，无时区语义 */
  date: string;
  title: string;
  content: string;
  /** 心情，早期数据没有该字段 */
  mood?: MoodId;
  /** ISO 8601 时间戳 */
  createdAt: string;
  /** ISO 8601 时间戳 */
  updatedAt: string;
}

/** 编辑器提交的正文数据（不含系统字段） */
export interface EntryDraft {
  title: string;
  content: string;
  /** null 表示明确清除心情；undefined 表示未提及 */
  mood?: MoodId | null;
}

/** localStorage 信封，version 用于以后迁移 */
export interface EntriesEnvelope {
  version: 1;
  entries: DiaryEntry[];
}