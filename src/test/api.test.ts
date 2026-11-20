import { describe, expect, it, vi } from 'vitest';
import { ApiError, createDiaryApi } from '../domain/api';
import type { DiaryEntry } from '../domain/types';

const entry: DiaryEntry = {
  id: 'entry-1',
  date: '2026-11-19',
  title: '联调',
  content: '写入 MySQL',
  mood: 'happy',
  font: 'xing',
  attachments: [{ id: 'l1', kind: 'link', title: '示例', url: 'https://example.com/' }],
  createdAt: '2026-11-19T01:00:00.000Z',
  updatedAt: '2026-11-19T01:00:00.000Z',
};

function respondWith(response: unknown) {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(response),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createDiaryApi', () => {
  it('list 请求 /api/entries 并解析 entries', async () => {
    const fetchMock = respondWith({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ entries: [entry] }),
    });

    const api = createDiaryApi('http://api.local');
    await expect(api.list()).resolves.toEqual([entry]);
    expect(fetchMock).toHaveBeenCalledWith('http://api.local/api/entries', {
      headers: { Accept: 'application/json' },
    });
  });

  it('entries 不是数组时返回空列表', async () => {
    respondWith({ ok: true, status: 200, json: () => Promise.resolve({ entries: null }) });

    await expect(createDiaryApi('http://api.local').list()).resolves.toEqual([]);
  });

  it('save 以 PUT 发送完整 entry 到日期路径', async () => {
    const fetchMock = respondWith({ ok: true, status: 200, json: () => Promise.resolve({}) });

    await createDiaryApi('http://api.local').save(entry);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.local/api/entries/2026-11-19');
    expect(init?.method).toBe('PUT');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual(entry);
  });

  it('remove 以 DELETE 请求日期路径', async () => {
    const fetchMock = respondWith({ ok: true, status: 200, json: () => Promise.resolve({}) });

    await createDiaryApi('http://api.local').remove('2026-11-19');

    expect(fetchMock).toHaveBeenCalledWith('http://api.local/api/entries/2026-11-19', {
      method: 'DELETE',
    });
  });

  it('非 2xx 抛出带状态码的 ApiError', async () => {
    respondWith({ ok: false, status: 503, json: () => Promise.resolve({ error: 'down' }) });

    const failure = createDiaryApi('http://api.local').list();
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(createDiaryApi('http://api.local').list()).rejects.toMatchObject({
      status: 503,
    });
  });
});