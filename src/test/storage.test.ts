import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../domain/constants';
import { upsertEntry } from '../domain/factory';
import { loadEntries, saveEntries } from '../domain/storage';
import type { DiaryEntry } from '../domain/types';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

const ENTRY: DiaryEntry = {
  id: 'entry-1',
  date: '2026-11-19',
  title: '第一篇',
  content: '今天开始写日记。',
  createdAt: '2026-11-19T01:00:00.000Z',
  updatedAt: '2026-11-19T01:00:00.000Z',
};

describe('storage', () => {
  it('保存后可原样读回并按日期倒序', () => {
    const storage = createMemoryStorage();
    const older = { ...ENTRY, id: 'entry-0', date: '2026-11-01' };
    expect(saveEntries(storage, [older, ENTRY])).toBe(true);
    expect(loadEntries(storage).map((entry) => entry.date)).toEqual([
      '2026-11-19',
      '2026-11-01',
    ]);
  });

  it('损坏 JSON 返回空数组', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, '{oops');
    expect(loadEntries(storage)).toEqual([]);
  });

  it('丢弃缺字段与非法日期，同一天只留一条', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        entries: [
          ENTRY,
          { ...ENTRY, id: 'dup' },
          { ...ENTRY, id: 'bad-date', date: '2026-02-30' },
          { ...ENTRY, id: 'no-content', content: undefined },
          null,
          'nope',
        ],
      }),
    );
    expect(loadEntries(storage)).toEqual([ENTRY]);
  });

  it('兼容早期直接存数组的格式', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify([ENTRY]));
    expect(loadEntries(storage)).toEqual([ENTRY]);
  });

  it('缺少 mood 的旧数据仍可读', () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: [ENTRY] }));
    expect(loadEntries(storage)).toEqual([ENTRY]);
  });

  it('合法 mood 原样读回，非法 mood 被剥离但日记保留', () => {
    const storage = createMemoryStorage();
    const withMood = { ...ENTRY, id: 'mood-ok', date: '2026-11-18', mood: 'calm' };
    const badMood = { ...ENTRY, id: 'mood-bad', date: '2026-11-17', mood: 'ecstatic' };
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, entries: [withMood, badMood] }),
    );
    expect(loadEntries(storage)).toEqual([
      withMood,
      { ...ENTRY, id: 'mood-bad', date: '2026-11-17' },
    ]);
  });

  it('写入失败时返回 false 而不是抛错', () => {
    const storage: Storage = {
      length: 0,
      clear() {},
      getItem() {
        return null;
      },
      key() {
        return null;
      },
      removeItem() {},
      setItem() {
        throw new Error('quota exceeded');
      },
    };
    expect(saveEntries(storage, [ENTRY])).toBe(false);
  });
});

describe('upsertEntry', () => {
  it('新建并插到最前面', () => {
    const entries = upsertEntry([], '2026-11-19', { title: '  标题 ', content: '正文\n\n' }, '2026-11-19T01:00:00.000Z');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      date: '2026-11-19',
      title: '标题',
      content: '正文',
      createdAt: '2026-11-19T01:00:00.000Z',
      updatedAt: '2026-11-19T01:00:00.000Z',
    });
  });

  it('同一天更新正文，保留 id 与创建时间', () => {
    const [updated] = upsertEntry(
      [ENTRY],
      '2026-11-19',
      { title: '改过的标题', content: '改过的正文' },
      '2026-11-20T02:00:00.000Z',
    );
    expect(updated.id).toBe(ENTRY.id);
    expect(updated.createdAt).toBe(ENTRY.createdAt);
    expect(updated.updatedAt).toBe('2026-11-20T02:00:00.000Z');
    expect(updated.title).toBe('改过的标题');
  });

  it('新建时写入心情', () => {
    const [created] = upsertEntry(
      [],
      '2026-11-19',
      { title: '开心的一天', content: '正文', mood: 'happy' },
      '2026-11-19T01:00:00.000Z',
    );
    expect(created.mood).toBe('happy');
  });

  it('更新时保留、覆盖或清除心情', () => {
    const withMood: DiaryEntry = { ...ENTRY, mood: 'calm' };
    const now = '2026-11-20T02:00:00.000Z';

    const [kept] = upsertEntry([withMood], ENTRY.date, { title: '改', content: '改' }, now);
    expect(kept.mood).toBe('calm');

    const [replaced] = upsertEntry(
      [withMood],
      ENTRY.date,
      { title: '改', content: '改', mood: 'sad' },
      now,
    );
    expect(replaced.mood).toBe('sad');

    const [cleared] = upsertEntry(
      [withMood],
      ENTRY.date,
      { title: '改', content: '改', mood: null },
      now,
    );
    expect(cleared).not.toHaveProperty('mood');
  });
});