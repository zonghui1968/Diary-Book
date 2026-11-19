import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('立体日记本', () => {
  it('默认合上：只看到封面，正文不可见也不可交互', () => {
    const { container } = render(<App />);

    const cover = screen.getByRole('button', { name: '打开日记本' });
    expect(cover).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: '日记正文' })).not.toBeInTheDocument();

    const pages = container.querySelector('.book-pages');
    expect(pages).toHaveAttribute('aria-hidden', 'true');
    expect(pages).toHaveAttribute('inert');
  });

  it('点击封面打开、点合上按钮回到封面', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: '打开日记本' }));

    expect(container.querySelector('.book-stage')).toHaveClass('is-open');
    expect(container.querySelector('.book-cover')).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.book-pages')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByLabelText('日记正文')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '合上日记本' }));

    expect(container.querySelector('.book-stage')).not.toHaveClass('is-open');
    expect(screen.getByRole('button', { name: '打开日记本' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '日记正文' })).not.toBeInTheDocument();
  });

  it('页码按日期升序：第 1 页 / 共 2 页 切到 第 2 页 / 共 2 页', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '打开日记本' }));
    expect(screen.getByText('第 1 页 / 共 1 页')).toBeInTheDocument();

    const dateInput = screen.getByLabelText('翻到某一天');

    fireEvent.change(dateInput, { target: { value: '2024-05-01' } });
    await user.type(screen.getByLabelText('日记正文'), '五月一日，晴。');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('第 1 页 / 共 1 页')).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: '2024-05-02' } });
    await user.type(screen.getByLabelText('日记正文'), '五月二日，有风。');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('第 2 页 / 共 2 页')).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: '2024-05-01' } });
    expect(screen.getByText('第 1 页 / 共 2 页')).toBeInTheDocument();

    fireEvent.change(dateInput, { target: { value: '2024-05-02' } });
    expect(screen.getByText('第 2 页 / 共 2 页')).toBeInTheDocument();
  });
});