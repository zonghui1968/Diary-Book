import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FontPicker } from '../components/FontPicker';

describe('FontPicker', () => {
  it('下拉列出默认与楷书、行书、草书，默认选中并展示示例', () => {
    render(<FontPicker value={undefined} onChange={() => {}} />);

    expect(screen.getByText('字体')).toBeInTheDocument();

    const select = screen.getByLabelText('正文字体');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options.map((option) => option.textContent)).toEqual(['默认', '楷书', '行书', '草书']);

    expect(screen.getByText('永和九年')).toBeInTheDocument();
  });

  it('选行书回调 xing，并按所选字体渲染预览', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<FontPicker value={undefined} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('正文字体'), 'xing');
    expect(onChange).toHaveBeenCalledWith('xing');

    rerender(<FontPicker value="xing" onChange={onChange} />);
    expect(screen.getByLabelText('正文字体')).toHaveValue('xing');
    expect(screen.getByText('永和九年').style.fontFamily).toContain('Ma Shan Zheng');
  });

  it('选默认回调 undefined', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FontPicker value="kai" onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('正文字体'), '');
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});