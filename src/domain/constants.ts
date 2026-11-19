import type { MoodId } from './types';

export const APP_NAME = '拾光日记';
export const APP_TAGLINE = '把今天留下来';

export const STORAGE_KEY = 'diary-book.entries.v1';

export const MAX_TITLE_LENGTH = 80;
export const MAX_CONTENT_LENGTH = 20000;

/** 新建日记时若标题为空，列表与编辑器使用的占位标题 */
export const UNTITLED = '无标题';

export interface MoodOption {
  id: MoodId;
  emoji: string;
  label: string;
}

/** 编辑器可选的每日心情，顺序即展示顺序 */
export const MOODS: readonly MoodOption[] = [
  { id: 'happy', emoji: '😄', label: '开心' },
  { id: 'calm', emoji: '😌', label: '平静' },
  { id: 'loved', emoji: '🥰', label: '幸福' },
  { id: 'sad', emoji: '😢', label: '难过' },
  { id: 'anxious', emoji: '😰', label: '焦虑' },
  { id: 'angry', emoji: '😠', label: '生气' },
  { id: 'tired', emoji: '😪', label: '疲惫' },
];

export const MOOD_BY_ID = Object.fromEntries(
  MOODS.map((mood) => [mood.id, mood]),
) as Record<MoodId, MoodOption>;

/** 运行时校验：外部数据里的 mood 是否合法（类型守卫，供 storage/factory 收窄） */
export function isMoodId(value: unknown): value is MoodId {
  return typeof value === 'string' && Object.hasOwn(MOOD_BY_ID, value);
}