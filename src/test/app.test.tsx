import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { STORAGE_KEY } from '../domain/constants';
import type { EntriesEnvelope } from '../domain/types';

function readStoredEntries(): EntriesEnvelope['entries'] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  return (JSON.parse(raw) as EntriesEnvelope).entries;
}

describe('App', () => {
  it('可以写一篇日记并保存到 localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: '拾光日记' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('日记标题'), '十一月的雨');
    await user.type(screen.getByLabelText('日记正文'), '下班路上下了很久的雨。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    const stored = readStoredEntries();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      title: '十一月的雨',
      content: '下班路上下了很久的雨。',
    });
    expect(screen.getByText('十一月的雨')).toBeInTheDocument();
    expect(screen.getByText('已保存')).toBeInTheDocument();
  });

  it('删除日记后列表回到空状态', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);

    await user.type(screen.getByLabelText('日记标题'), '临时');
    await user.type(screen.getByLabelText('日记正文'), '稍后删除');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await user.click(screen.getByRole('button', { name: '删除' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(readStoredEntries()).toHaveLength(0);
    expect(screen.getByText(/日记本还是空的/)).toBeInTheDocument();
  });
});