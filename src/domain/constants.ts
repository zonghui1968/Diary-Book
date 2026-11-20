import type { FontId, MoodId, WeatherId } from './types';

export const APP_NAME = '拾光日记';
export const APP_TAGLINE = '把今天留下来';

export const STORAGE_KEY = 'diary-book.entries.v1';

export const MAX_TITLE_LENGTH = 80;
export const MAX_CONTENT_LENGTH = 20000;

/** 新建日记时若标题为空，列表与编辑器使用的占位标题 */
export const UNTITLED = '无标题';

export interface FontOption {
  id: FontId;
  label: string;
  /** 直接用于 style.fontFamily 的字体族串 */
  cssFamily: string;
  /** 按钮上的示例文字 */
  sample: string;
}

/** 正文字体候选，顺序与界面按钮顺序一致 */
export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'kai',
    label: '楷书',
    cssFamily: "'KaiTi', 'STKaiti', 'Kaiti SC', '楷体', serif",
    sample: '永和九年',
  },
  {
    id: 'xing',
    label: '行书',
    cssFamily: "'Ma Shan Zheng', 'STXingkai', '华文行楷', cursive",
    sample: '永和九年',
  },
  {
    id: 'cao',
    label: '草书',
    cssFamily: "'Zhi Mang Xing', 'STXingkai', cursive",
    sample: '永和九年',
  },
];

/** 按 id 查字体配置 */
export const FONT_BY_ID: Record<FontId, FontOption> = {
  kai: FONT_OPTIONS[0],
  xing: FONT_OPTIONS[1],
  cao: FONT_OPTIONS[2],
};

/** 校验任意值是否为合法字体 id（用于读取旧数据与草稿规整） */
export function isFontId(value: unknown): value is FontId {
  return value === 'kai' || value === 'xing' || value === 'cao';
}

/** 字体 id → CSS font-family；未选字体时回落到全局正文字体 */
export function fontFamilyOf(font: FontId | undefined): string {
  return font === undefined ? 'var(--font-body)' : FONT_BY_ID[font].cssFamily;
}

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

export interface WeatherOption {
  id: WeatherId;
  label: string;
  emoji: string;
}

/** 编辑器可选的天气，顺序即下拉顺序 */
export const WEATHER_OPTIONS: WeatherOption[] = [
  { id: 'sunny', label: '晴', emoji: '☀️' },
  { id: 'cloudy', label: '阴', emoji: '☁️' },
  { id: 'rain', label: '雨', emoji: '🌧️' },
  { id: 'snow', label: '雪', emoji: '❄️' },
  { id: 'wind', label: '风', emoji: '🍃' },
];

export const WEATHER_BY_ID = Object.fromEntries(
  WEATHER_OPTIONS.map((weather) => [weather.id, weather]),
) as Record<WeatherId, WeatherOption>;

/** 运行时校验：外部数据里的 weather 是否合法 */
export function isWeatherId(value: unknown): value is WeatherId {
  return typeof value === 'string' && Object.hasOwn(WEATHER_BY_ID, value);
}