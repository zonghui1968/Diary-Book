import type { DiaryEntry } from './types';

/** 非 2xx 响应统一抛出，带上 HTTP 状态码，方便上层区分离线与校验失败。 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface DiaryApi {
  list(): Promise<DiaryEntry[]>;
  save(entry: DiaryEntry): Promise<void>;
  remove(date: string): Promise<void>;
}

/** 默认走同源 /api（Vite 代理到 127.0.0.1:3001），可用 VITE_API_BASE 覆盖。 */
export function createDiaryApi(base = import.meta.env.VITE_API_BASE ?? ''): DiaryApi {
  const root = base.replace(/\/+$/, '');

  async function request(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${root}${path}`, init);
    if (!response.ok) {
      throw new ApiError(response.status, `请求 ${path} 失败（HTTP ${response.status}）`);
    }
    return response;
  }

  return {
    async list() {
      const response = await request('/api/entries', {
        headers: { Accept: 'application/json' },
      });
      const payload = (await response.json()) as { entries?: unknown };
      if (!Array.isArray(payload.entries)) {
        return [];
      }
      return payload.entries as DiaryEntry[];
    },

    async save(entry) {
      await request(`/api/entries/${encodeURIComponent(entry.date)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    },

    async remove(date) {
      await request(`/api/entries/${encodeURIComponent(date)}`, { method: 'DELETE' });
    },
  };
}