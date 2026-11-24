import type { MoodId, WeatherId } from './types';

/** 页面底纹/插图主题；plain 表示素页 */
export type PagePattern =
  | 'sunny'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'fog'
  | 'storm'
  | 'plain';

export interface PageTheme {
  pattern: PagePattern;
  /** 主题文字，例如「小雪」 */
  label: string;
  illustration: PagePattern;
}

const WEATHER_THEMES: Record<WeatherId, PageTheme> = {
  sunny: { pattern: 'sunny', label: '晴', illustration: 'sunny' },
  cloudy: { pattern: 'cloudy', label: '阴', illustration: 'cloudy' },
  rain: { pattern: 'rain', label: '小雨', illustration: 'rain' },
  snow: { pattern: 'snow', label: '小雪', illustration: 'snow' },
  wind: { pattern: 'wind', label: '微风', illustration: 'wind' },
  fog: { pattern: 'fog', label: '雾', illustration: 'fog' },
  storm: { pattern: 'storm', label: '雷雨', illustration: 'storm' },
};

/** 没记录天气时用心情兜底 */
const MOOD_PATTERNS: Record<MoodId, Exclude<PagePattern, 'plain'>> = {
  happy: 'sunny',
  calm: 'cloudy',
  loved: 'sunny',
  sad: 'rain',
  anxious: 'wind',
  angry: 'rain',
  tired: 'snow',
};

const PATTERN_LABELS: Record<PagePattern, string> = {
  sunny: '晴',
  cloudy: '阴',
  rain: '小雨',
  snow: '小雪',
  wind: '微风',
  fog: '雾',
  storm: '雷雨',
  plain: '素页',
};

const PLAIN_THEME: PageTheme = {
  pattern: 'plain',
  label: PATTERN_LABELS.plain,
  illustration: 'plain',
};

/**
 * 天气优先、心情兜底，都没有（或值非法）时回到素页。
 * 纯函数，遇到未登记的运行时值也不会抛错。
 */
export function resolvePageTheme(weather?: WeatherId, mood?: MoodId): PageTheme {
  if (weather && Object.hasOwn(WEATHER_THEMES, weather)) {
    return WEATHER_THEMES[weather];
  }
  if (mood && Object.hasOwn(MOOD_PATTERNS, mood)) {
    const pattern = MOOD_PATTERNS[mood];
    return { pattern, label: PATTERN_LABELS[pattern], illustration: pattern };
  }
  return PLAIN_THEME;
}