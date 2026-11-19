import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FontPicker } from '../components/FontPicker';

describe('FontPicker', () => {
  it('渲染默认与楷书、行书、草书，默认选中且示例用各自字体', () => {
    render(<FontPicker value={undefined} onChange={() => {}} />);

    expect(screen.getByRole('group', { name: '正文字体' })).toBeInTheDocument();
    for (const name of ['默认', '楷书', '行书', '草书']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }

    const defaults = screen.getByRole('button', { name: '默认' });
    expect(defaults).toHaveAttribute('aria-pressed', 'true');
    expect(defaults).toHaveClass('is-active');

    const samples = [
      ['楷书', 'KaiTi'],
      ['行书', 'Ma Shan Zheng'],
      ['草书', 'Zhi Mang Xing'],
    ] as const;
    for (const [name, family] of samples) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveTextContent('永和九年');
      expect(button.querySelector<HTMLElement>('.font-option-sample')?.style.fontFamily).toContain(
        family,
      );
    }
  });

  it('点击字体按钮回调对应 id，并标记当前选中项', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FontPicker value="xing" onChange={onChange} />);

    const xing = screen.getByRole('button', { name: '行书' });
    expect(xing).toHaveAttribute('aria-pressed', 'true');
    expect(xing).toHaveClass('is-active');
    expect(screen.getByRole('button', { name: '默认' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.click(screen.getByRole('button', { name: '草书' }));
    expect(onChange).toHaveBeenCalledWith('cao');
  });

  it('点击默认按钮清除选择', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FontPicker value="kai" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '默认' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});