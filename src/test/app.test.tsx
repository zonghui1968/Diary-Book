import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { STORAGE_KEY } from '../domain/constants';
import { todayString } from '../domain/date';
import type { EntriesEnvelope } from '../domain/types';

/** 封面默认合上，正文在书里：每个用例先翻开日记本 */
async function openBook(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: '打开日记本' }));
}

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
    await openBook(user);

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

  it('添加链接后保存，localStorage 与列表都反映附件', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openBook(user);

    await user.type(screen.getByLabelText('日记标题'), '带附件的日记');
    await user.type(screen.getByLabelText('日记正文'), '今天读到一篇文章。');
    await user.click(screen.getByRole('button', { name: '添加链接' }));
    await user.type(screen.getByLabelText('链接标题'), '参考文章');
    await user.type(screen.getByLabelText('链接网址'), 'https://example.com/post');
    await user.click(screen.getByRole('button', { name: '确认添加链接' }));
    await user.click(screen.getByRole('button', { name: '保存' }));

    const stored = readStoredEntries();
    expect(stored).toHaveLength(1);
    expect(stored[0].attachments).toEqual([
      {
        id: expect.any(String),
        kind: 'link',
        title: '参考文章',
        url: 'https://example.com/post',
      },
    ]);
    expect(screen.getByText('📎 1')).toBeInTheDocument();
    expect(screen.getByText('已保存')).toBeInTheDocument();
  });

  it('选择心情并保存后写入 localStorage，列表显示 emoji', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openBook(user);

    await user.selectOptions(screen.getByLabelText('今天的心情'), 'happy');
    await user.type(screen.getByLabelText('日记标题'), '有心情的一天');
    await user.type(screen.getByLabelText('日记正文'), '今天很开心。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(readStoredEntries()[0]).toMatchObject({
      title: '有心情的一天',
      mood: 'happy',
    });

    const list = screen.getByRole('list', { name: '日记列表' });
    const badge = within(list).getByLabelText('心情：开心');
    expect(badge).toHaveTextContent('😄');
  });

  it('删除日记后列表回到空状态', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);
    await openBook(user);

    await user.type(screen.getByLabelText('日记标题'), '临时');
    await user.type(screen.getByLabelText('日记正文'), '稍后删除');
    await user.click(screen.getByRole('button', { name: '保存' }));
    await user.click(screen.getByRole('button', { name: '删除' }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(readStoredEntries()).toHaveLength(0);
    expect(screen.getByText(/日记本还是空的/)).toBeInTheDocument();
  });

  it('选行书写作后保存字体，切换日期再切回来重新应用', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openBook(user);

    await user.selectOptions(screen.getByLabelText('正文字体'), 'xing');
    await user.type(screen.getByLabelText('日记正文'), '落笔自带行书的连势。');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(readStoredEntries()[0]).toMatchObject({
      font: 'xing',
      content: '落笔自带行书的连势。',
    });
    expect(screen.getByLabelText('日记正文').style.fontFamily).toContain('Ma Shan Zheng');

    const dateInput = screen.getByLabelText('翻到某一天');
    fireEvent.change(dateInput, { target: { value: '2001-02-03' } });
    expect(screen.getByLabelText('日记正文')).toHaveValue('');

    fireEvent.change(dateInput, { target: { value: todayString() } });
    const textarea = screen.getByLabelText('日记正文');
    expect(textarea).toHaveValue('落笔自带行书的连势。');
    expect(textarea.style.fontFamily).toContain('Ma Shan Zheng');
    expect(screen.getByLabelText('正文字体')).toHaveValue('xing');
    expect(screen.getByTitle('字体：行书')).toHaveTextContent('行');
  });
});