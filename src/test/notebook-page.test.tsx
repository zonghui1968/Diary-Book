import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { STORAGE_KEY } from '../domain/constants';
import { todayString } from '../domain/date';
import type { DiaryEntry, EntriesEnvelope } from '../domain/types';

function readStoredEntries(): EntriesEnvelope['entries'] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as EntriesEnvelope).entries : [];
}

function seedEntries(entries: DiaryEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries }));
}

describe('NotebookPage', () => {
  it('选择雪天后保存，localStorage 有 weather，页面切到雪景底纹与插图', async () => {
    const user = userEvent.setup();
    render(<App />);

    const textarea = screen.getByLabelText('日记正文');
    await user.selectOptions(screen.getByLabelText('当天天气'), 'snow');
    await user.type(textarea, '窗外落了一层薄雪。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(readStoredEntries()[0]).toMatchObject({
      content: '窗外落了一层薄雪。',
      weather: 'snow',
    });
    expect(document.querySelector('.page-pattern--snow')).not.toBeNull();
    expect(document.querySelector('.page-illustration--snow')).not.toBeNull();
    expect(textarea).toHaveClass('editor-content--ruled');

    await user.selectOptions(screen.getByLabelText('当天天气'), '');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(readStoredEntries()[0]).not.toHaveProperty('weather');
    expect(document.querySelector('.page-pattern--plain')).not.toBeNull();
  });

  it('上一页/下一页切换日期与内容，并带翻页动画类', async () => {
    const user = userEvent.setup();
    const today = todayString();
    const older = '2001-02-03';
    seedEntries([
      {
        id: 'older',
        date: older,
        title: '旧的一页',
        content: '旧内容',
        createdAt: '2001-02-03T02:00:00.000Z',
        updatedAt: '2001-02-03T02:00:00.000Z',
      },
      {
        id: 'today',
        date: today,
        title: '今天的一页',
        content: '今天内容',
        createdAt: '2026-11-19T02:00:00.000Z',
        updatedAt: '2026-11-19T02:00:00.000Z',
      },
    ]);

    render(<App />);

    expect(screen.getByLabelText('日记正文')).toHaveValue('今天内容');
    expect(document.querySelector('.notebook-page')).toHaveAttribute(
      'data-page-number',
      '2',
    );
    expect(document.querySelector('.notebook-page')).toHaveAttribute(
      'data-page-count',
      '2',
    );
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '上一页' }));
    expect(screen.getByLabelText('日记正文')).toHaveValue('旧内容');
    expect(document.querySelector('.editor-date')).toHaveTextContent('2001年2月3日');
    expect(document.querySelector('.page-turn--prev')).not.toBeNull();
    expect(document.querySelector('.page-turn--prev .page-turn-sheet')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: '下一页' }));
    expect(screen.getByLabelText('日记正文')).toHaveValue('今天内容');
    expect(document.querySelector('.page-turn--next')).not.toBeNull();
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('没有天气时按心情兜底出雨景', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '难过' }));
    await user.type(screen.getByLabelText('日记正文'), '有点难过。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(document.querySelector('.page-pattern--rain')).not.toBeNull();
    expect(document.querySelector('.page-illustration--rain')).not.toBeNull();
  });
});