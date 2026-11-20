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

/** 正文字体：楷书 / 行书 / 草书 */
export type FontId = 'kai' | 'xing' | 'cao';

/** 当天天气：晴 / 阴 / 雨 / 雪 / 风 */
export type WeatherId = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'wind';

/** 本地图片附件，dataUrl 为 data:image/… 形式 */
export interface ImageAttachment {
  id: string;
  kind: 'image';
  name: string;
  dataUrl: string;
}

/** 网络链接附件，url 只允许 http/https */
export interface LinkAttachment {
  id: string;
  kind: 'link';
  title: string;
  url: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

/** 简易图表附件，points 至少一项 */
export interface ChartAttachment {
  id: string;
  kind: 'chart';
  chartType: 'bar' | 'line';
  title: string;
  points: ChartPoint[];
}

export type Attachment = ImageAttachment | LinkAttachment | ChartAttachment;

/** 一篇日记（持久化形态） */
export interface DiaryEntry {
  id: string;
  /** 本地日期，格式 'YYYY-MM-DD'，无时区语义 */
  date: string;
  title: string;
  content: string;
  /** 正文字体；缺省表示默认字体 */
  font?: FontId;
  /** 心情，早期数据没有该字段 */
  mood?: MoodId;
  /** 天气，早期数据没有该字段 */
  weather?: WeatherId;
  /** 附件，早期数据没有该字段 */
  attachments?: Attachment[];
  /** ISO 8601 时间戳 */
  createdAt: string;
  /** ISO 8601 时间戳 */
  updatedAt: string;
}

/** 编辑器提交的正文数据（不含系统字段） */
export interface EntryDraft {
  title: string;
  content: string;
  /** 正文字体；null / undefined 表示默认字体 */
  font?: FontId | null;
  /** null 表示明确清除心情；undefined 表示未提及 */
  mood?: MoodId | null;
  /** null 表示明确清除天气；undefined 表示未提及 */
  weather?: WeatherId | null;
  attachments?: Attachment[];
}

/** localStorage 信封，version 用于以后迁移 */
export interface EntriesEnvelope {
  version: 1;
  entries: DiaryEntry[];
}