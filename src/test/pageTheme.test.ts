import { describe, expect, it } from 'vitest';
import type { MoodId, WeatherId } from '../domain/types';
import { resolvePageTheme } from '../domain/pageTheme';

describe('resolvePageTheme', () => {
  it('有天气时天气优先于心情', () => {
    expect(resolvePageTheme('snow', 'happy')).toEqual({
      pattern: 'snow',
      label: '小雪',
      illustration: 'snow',
    });
    expect(resolvePageTheme('wind', 'sad').pattern).toBe('wind');
  });

  it('七种天气都映射到同名图案、插图与中文标签', () => {
    const expected: [WeatherId, string][] = [
      ['sunny', '晴'],
      ['cloudy', '阴'],
      ['rain', '小雨'],
      ['snow', '小雪'],
      ['wind', '微风'],
      ['fog', '雾'],
      ['storm', '雷雨'],
    ];
    for (const [weather, label] of expected) {
      const theme = resolvePageTheme(weather);
      expect(theme).toEqual({ pattern: weather, label, illustration: weather });
    }
  });

  it('没有天气时按心情兜底', () => {
    const expected: [MoodId, string][] = [
      ['happy', 'sunny'],
      ['calm', 'cloudy'],
      ['loved', 'sunny'],
      ['sad', 'rain'],
      ['anxious', 'wind'],
      ['angry', 'rain'],
      ['tired', 'snow'],
    ];
    for (const [mood, pattern] of expected) {
      expect(resolvePageTheme(undefined, mood).pattern).toBe(pattern);
    }
  });

  it('没有天气和心情、或值非法时回到素页', () => {
    expect(resolvePageTheme()).toMatchObject({ pattern: 'plain', illustration: 'plain' });
    expect(resolvePageTheme(undefined, undefined).pattern).toBe('plain');
    expect(resolvePageTheme('hail' as WeatherId).pattern).toBe('plain');
    expect(resolvePageTheme(undefined, 'ecstatic' as MoodId).pattern).toBe('plain');
  });
});