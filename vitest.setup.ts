import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Node 22+ 自带一个需要 --localstorage-file 才可用的 localStorage 占位 getter，
 * 在 jsdom 环境中会遮蔽 jsdom 自己的实现（window === globalThis），
 * 导致 window.localStorage 为 undefined。这里补一个内存实现。
 */
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

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

// 每个用例后清理 DOM 与 localStorage，保证用例互相隔离
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});