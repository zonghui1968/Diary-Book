import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoodPicker } from '../components/MoodPicker';
import { MOODS } from '../domain/constants';

describe('MoodPicker', () => {
  it('下拉包含不记录与全部心情选项', () => {
    render(<MoodPicker value={undefined} onChange={() => {}} />);

    const select = screen.getByLabelText('今天的心情');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(MOODS.length + 1);
    expect(options[0]).toHaveTextContent('不记录');
    for (const [index, mood] of MOODS.entries()) {
      const option = options[index + 1];
      expect(option).toHaveValue(mood.id);
      expect(option).toHaveTextContent(`${mood.emoji} ${mood.label}`);
    }
  });

  it('选中文本反映当前心情', () => {
    render(<MoodPicker value="calm" onChange={() => {}} />);

    const select = screen.getByLabelText<HTMLSelectElement>('今天的心情');
    expect(select).toHaveValue('calm');
    expect(select.selectedOptions[0]?.textContent).toBe('😌 平静');
  });

  it('选择心情回调对应 id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodPicker value={undefined} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('今天的心情'), 'happy');

    expect(onChange).toHaveBeenCalledWith('happy');
  });

  it('选择不记录回调 undefined', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MoodPicker value="sad" onChange={onChange} />);

    const select = screen.getByLabelText('今天的心情');
    await user.selectOptions(select, '');

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});