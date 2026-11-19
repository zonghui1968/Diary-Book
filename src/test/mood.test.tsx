import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoodPicker } from '../components/MoodPicker';
import { MOODS } from '../domain/constants';

describe('MoodPicker', () => {
  it('渲染全部心情与不记录按钮', () => {
    render(<MoodPicker value={undefined} onChange={() => {}} />);

    expect(screen.getByRole('group', { name: '今天的心情' })).toBeInTheDocument();
    for (const mood of MOODS) {
      const option = screen.getByRole('button', { name: mood.label });
      expect(option).toHaveAttribute('aria-pressed', 'false');
      expect(option).toHaveTextContent(mood.emoji);
    }
    expect(screen.getByRole('button', { name: '不记录心情' })).toBeInTheDocument();
  });

  it('点击心情回调对应 id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodPicker value={undefined} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '难过' }));

    expect(onChange).toHaveBeenCalledWith('sad');
  });

  it('再次点击已选中的心情取消，点不记录也清除', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodPicker value="calm" onChange={onChange} />);

    const calm = screen.getByRole('button', { name: '平静' });
    expect(calm).toHaveAttribute('aria-pressed', 'true');

    await user.click(calm);
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    await user.click(screen.getByRole('button', { name: '不记录心情' }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});