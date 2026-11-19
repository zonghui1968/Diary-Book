import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentChart } from '../components/AttachmentChart';
import { AttachmentPanel } from '../components/AttachmentPanel';
import type { Attachment } from '../domain/types';

function PanelHarness() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  return <AttachmentPanel attachments={attachments} onChange={setAttachments} />;
}

describe('AttachmentChart', () => {
  it('柱状图渲染 svg、标签与标题', () => {
    render(
      <AttachmentChart
        title="本周运动"
        chartType="bar"
        points={[
          { label: '周一', value: 3 },
          { label: '周二', value: 5 },
        ]}
      />,
    );

    expect(
      screen.getByRole('img', { name: /本周运动（柱状图/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('周一')).toBeInTheDocument();
    expect(screen.getByText('周二')).toBeInTheDocument();
  });

  it('折线图渲染 svg 且负值不报错', () => {
    const { container } = render(
      <AttachmentChart
        chartType="line"
        points={[
          { label: '周一', value: -2 },
          { label: '周二', value: 4 },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: /折线图/ })).toBeInTheDocument();
    expect(container.querySelector('polyline')).not.toBeNull();
  });

  it('空数据不渲染', () => {
    const { container } = render(<AttachmentChart chartType="bar" points={[]} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('AttachmentPanel', () => {
  it('添加合法链接后回调收到 link', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);

    await user.click(screen.getByRole('button', { name: '添加链接' }));
    await user.type(screen.getByLabelText('链接标题'), '示例站点');
    await user.type(screen.getByLabelText('链接网址'), 'https://example.com');
    await user.click(screen.getByRole('button', { name: '确认添加链接' }));

    const link = screen.getByRole('link', { name: '示例站点' });
    expect(link).toHaveAttribute('href', 'https://example.com/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer noopener');
  });

  it('javascript: 链接显示错误且不回调', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AttachmentPanel attachments={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '添加链接' }));
    await user.type(screen.getByLabelText('链接网址'), 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: '确认添加链接' }));

    expect(screen.getByRole('alert')).toHaveTextContent('只支持 http/https 链接');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('添加图表后渲染 svg 预览', async () => {
    const user = userEvent.setup();
    const { container } = render(<PanelHarness />);

    await user.click(screen.getByRole('button', { name: '添加图表' }));
    fireEvent.change(screen.getByLabelText('图表数据'), {
      target: { value: '周一,3\n周二,5' },
    });
    await user.click(screen.getByRole('button', { name: '确认添加图表' }));

    expect(screen.getByRole('img', { name: /柱状图/ })).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('周一')).toBeInTheDocument();
  });

  it('图表数据为空时提示且不回调', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AttachmentPanel attachments={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '添加图表' }));
    await user.click(screen.getByRole('button', { name: '确认添加图表' }));

    expect(screen.getByRole('alert')).toHaveTextContent('请输入至少一行');
    expect(onChange).not.toHaveBeenCalled();
  });
});