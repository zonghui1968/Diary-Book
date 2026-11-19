import { useCallback, useEffect, useState } from 'react';
import { upsertEntry } from '../domain/factory';
import { loadEntries, saveEntries } from '../domain/storage';
import type { DiaryEntry, EntryDraft } from '../domain/types';

export interface UseEntriesResult {
  entries: DiaryEntry[];
  entryCount: number;
  getEntry: (date: string) => DiaryEntry | undefined;
  saveEntry: (date: string, draft: EntryDraft, nowISO: string) => void;
  removeEntry: (date: string) => void;
}

function resolveStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** 日记状态 + localStorage 持久化。Storage 可注入，方便测试。 */
export function useEntries(storage: Storage | null = resolveStorage()): UseEntriesResult {
  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    storage ? loadEntries(storage) : [],
  );

  useEffect(() => {
    if (storage) {
      saveEntries(storage, entries);
    }
  }, [entries, storage]);

  const getEntry = useCallback(
    (date: string) => entries.find((entry) => entry.date === date),
    [entries],
  );

  const saveEntry = useCallback((date: string, draft: EntryDraft, nowISO: string) => {
    setEntries((current) => upsertEntry(current, date, draft, nowISO));
  }, []);

  const removeEntry = useCallback((date: string) => {
    setEntries((current) => current.filter((entry) => entry.date !== date));
  }, []);

  return {
    entries,
    entryCount: entries.length,
    getEntry,
    saveEntry,
    removeEntry,
  };
}