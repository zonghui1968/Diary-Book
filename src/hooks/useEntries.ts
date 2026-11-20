import { useCallback, useEffect, useRef, useState } from 'react';
import { createDiaryApi, type DiaryApi } from '../domain/api';
import { upsertEntry } from '../domain/factory';
import { loadEntries, saveEntries } from '../domain/storage';
import type { DiaryEntry, EntryDraft } from '../domain/types';

/** connecting：首次拉取中；server：MySQL 在线；local：本地缓存兜底 */
export type DataSource = 'connecting' | 'server' | 'local';

export interface UseEntriesResult {
  entries: DiaryEntry[];
  entryCount: number;
  getEntry: (date: string) => DiaryEntry | undefined;
  saveEntry: (date: string, draft: EntryDraft, nowISO: string) => void;
  removeEntry: (date: string) => void;
  dataSource: DataSource;
}

function resolveStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const defaultApi = createDiaryApi();

/**
 * 日记状态：localStorage 作为离线缓存先渲染，挂载后异步同步服务端；
 * 保存/删除先写本地再异步推送 API，失败时保持本地可用。
 */
export function useEntries(
  storage: Storage | null = resolveStorage(),
  api: DiaryApi = defaultApi,
): UseEntriesResult {
  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    storage ? loadEntries(storage) : [],
  );
  const [dataSource, setDataSource] = useState<DataSource>('connecting');
  const entriesRef = useRef(entries);
  const mountedRef = useRef(true);
  const mutatedRef = useRef(false);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (storage) {
      saveEntries(storage, entries);
    }
  }, [entries, storage]);

  // 首屏之后从服务端拉取；拉取前已有本地改动时不覆盖，避免丢失刚写的内容
  useEffect(() => {
    let cancelled = false;
    api
      .list()
      .then((remote) => {
        if (cancelled) {
          return;
        }
        if (!mutatedRef.current) {
          setEntries(remote);
        }
        setDataSource('server');
      })
      .catch(() => {
        if (!cancelled) {
          setDataSource('local');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const getEntry = useCallback(
    (date: string) => entries.find((entry) => entry.date === date),
    [entries],
  );

  const markSource = (source: DataSource) => {
    if (mountedRef.current) {
      setDataSource(source);
    }
  };

  const saveEntry = useCallback(
    (date: string, draft: EntryDraft, nowISO: string) => {
      const next = upsertEntry(entriesRef.current, date, draft, nowISO);
      entriesRef.current = next;
      mutatedRef.current = true;
      setEntries(next);

      const saved = next.find((entry) => entry.date === date);
      if (!saved) {
        return;
      }
      api
        .save(saved)
        .then(() => markSource('server'))
        .catch(() => markSource('local'));
    },
    [api],
  );

  const removeEntry = useCallback(
    (date: string) => {
      const next = entriesRef.current.filter((entry) => entry.date !== date);
      entriesRef.current = next;
      mutatedRef.current = true;
      setEntries(next);
      api
        .remove(date)
        .then(() => markSource('server'))
        .catch(() => markSource('local'));
    },
    [api],
  );

  return {
    entries,
    entryCount: entries.length,
    getEntry,
    saveEntry,
    removeEntry,
    dataSource,
  };
}