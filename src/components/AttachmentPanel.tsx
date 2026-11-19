import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  MAX_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  MAX_TOTAL_IMAGE_BYTES,
  parseChartPoints,
  sanitizeUrl,
  totalImageBytes,
} from '../domain/attachments';
import { makeId } from '../domain/factory';
import type {
  Attachment,
  ChartAttachment,
  ImageAttachment,
  LinkAttachment,
} from '../domain/types';
import { AttachmentChart } from './AttachmentChart';

interface AttachmentPanelProps {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}

function attachmentLabel(attachment: Attachment): string {
  switch (attachment.kind) {
    case 'image':
      return `图片 ${attachment.name}`;
    case 'link':
      return `链接 ${attachment.title}`;
    case 'chart':
      return `图表 ${attachment.title || '未命名'}`;
  }
}

/** 正文下方的附件区：本地图片、网络链接、简易图表 */
export function AttachmentPanel({ attachments, onChange }: AttachmentPanelProps) {
  const [activeForm, setActiveForm] = useState<'link' | 'chart' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [chartRaw, setChartRaw] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestAttachments = useRef(attachments);

  useEffect(() => {
    latestAttachments.current = attachments;
  }, [attachments]);

  const atLimit = attachments.length >= MAX_ATTACHMENTS;

  const toggleForm = (form: 'link' | 'chart') => {
    setActiveForm((current) => (current === form ? null : form));
    setError(null);
  };

  const addLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (atLimit) {
      setError(`最多添加 ${MAX_ATTACHMENTS} 个附件`);
      return;
    }
    const url = sanitizeUrl(linkUrl);
    if (url === null) {
      setError('只支持 http/https 链接');
      return;
    }
    const link: LinkAttachment = {
      id: `att_${makeId()}`,
      kind: 'link',
      title: linkTitle.trim() || new URL(url).hostname,
      url,
    };
    onChange([...attachments, link]);
    setLinkTitle('');
    setLinkUrl('');
    setActiveForm(null);
    setError(null);
  };

  const addChart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (atLimit) {
      setError(`最多添加 ${MAX_ATTACHMENTS} 个附件`);
      return;
    }
    const points = parseChartPoints(chartRaw);
    if (points.length === 0) {
      setError('请输入至少一行「标签,数值」数据');
      return;
    }
    const chart: ChartAttachment = {
      id: `att_${makeId()}`,
      kind: 'chart',
      chartType,
      title: chartTitle.trim(),
      points,
    };
    onChange([...attachments, chart]);
    setChartTitle('');
    setChartRaw('');
    setChartType('bar');
    setActiveForm(null);
    setError(null);
  };

  const addImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    setError(null);
    if (atLimit) {
      setError(`最多添加 ${MAX_ATTACHMENTS} 个附件`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('只支持图片文件');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`图片「${file.name}」超过 800 KB，请选择更小的图片`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const current = latestAttachments.current;
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl.startsWith('data:image/')) {
        setError('图片读取失败，请重试');
        return;
      }
      if (current.length >= MAX_ATTACHMENTS) {
        setError(`最多添加 ${MAX_ATTACHMENTS} 个附件`);
        return;
      }
      if (totalImageBytes(current) + dataUrl.length > MAX_TOTAL_IMAGE_BYTES) {
        setError('图片总量超过 1.8 MB，请先移除部分图片');
        return;
      }
      const image: ImageAttachment = {
        id: `att_${makeId()}`,
        kind: 'image',
        name: file.name || '图片',
        dataUrl,
      };
      onChange([...current, image]);
    };
    reader.onerror = () => setError('图片读取失败，请重试');
    reader.readAsDataURL(file);
  };

  return (
    <section className="attachment-panel" aria-label="附件">
      <div className="attachment-tools" role="group" aria-label="添加附件">
        <input
          ref={fileInputRef}
          className="attachment-file-input"
          type="file"
          accept="image/*"
          hidden
          aria-label="选择图片文件"
          onChange={addImage}
        />
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={() => fileInputRef.current?.click()}
          disabled={atLimit}
        >
          添加图片
        </button>
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={() => toggleForm('link')}
          disabled={atLimit}
          aria-expanded={activeForm === 'link'}
        >
          添加链接
        </button>
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={() => toggleForm('chart')}
          disabled={atLimit}
          aria-expanded={activeForm === 'chart'}
        >
          添加图表
        </button>
        <span className="attachment-count">
          附件 {attachments.length} / {MAX_ATTACHMENTS}
        </span>
      </div>

      {error && (
        <p className="attachment-error" role="alert">
          {error}
        </p>
      )}

      {activeForm === 'link' && (
        <form className="attachment-form" aria-label="添加链接" onSubmit={addLink}>
          <label className="attachment-field">
            链接标题
            <input
              type="text"
              value={linkTitle}
              placeholder="留空则使用域名"
              onChange={(event) => setLinkTitle(event.target.value)}
            />
          </label>
          <label className="attachment-field">
            链接网址
            <input
              type="text"
              value={linkUrl}
              placeholder="https://…"
              inputMode="url"
              onChange={(event) => setLinkUrl(event.target.value)}
            />
          </label>
          <div className="attachment-form-actions">
            <button type="submit" className="button button--small">
              确认添加链接
            </button>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setActiveForm(null)}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {activeForm === 'chart' && (
        <form className="attachment-form" aria-label="添加图表" onSubmit={addChart}>
          <label className="attachment-field">
            图表标题
            <input
              type="text"
              value={chartTitle}
              placeholder="例如：本周运动"
              onChange={(event) => setChartTitle(event.target.value)}
            />
          </label>
          <label className="attachment-field">
            图表类型
            <select
              value={chartType}
              onChange={(event) =>
                setChartType(event.target.value === 'line' ? 'line' : 'bar')
              }
            >
              <option value="bar">柱状图</option>
              <option value="line">折线图</option>
            </select>
          </label>
          <label className="attachment-field">
            图表数据
            <textarea
              value={chartRaw}
              rows={4}
              placeholder={'每行一条，例如：\n周一,3\n周二,5'}
              onChange={(event) => setChartRaw(event.target.value)}
            />
          </label>
          <div className="attachment-form-actions">
            <button type="submit" className="button button--small">
              确认添加图表
            </button>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => setActiveForm(null)}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {attachments.length > 0 && (
        <ul className="attachment-list" aria-label="已添加附件">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="attachment-card">
              {attachment.kind === 'image' && (
                <img
                  className="attachment-thumb"
                  src={attachment.dataUrl}
                  alt={attachment.name}
                />
              )}
              <div className="attachment-card-body">
                {attachment.kind === 'link' ? (
                  <>
                    <a
                      className="attachment-link"
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {attachment.title}
                    </a>
                    <span className="attachment-card-note">{attachment.url}</span>
                  </>
                ) : attachment.kind === 'chart' ? (
                  <>
                    <span className="attachment-card-title">
                      {attachment.title || '未命名图表'}
                    </span>
                    <div className="attachment-chart">
                      <AttachmentChart
                        points={attachment.points}
                        chartType={attachment.chartType}
                        title={attachment.title}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="attachment-card-title">{attachment.name}</span>
                    <span className="attachment-card-note">本地图片</span>
                  </>
                )}
              </div>
              <button
                type="button"
                className="button button--ghost button--small attachment-remove"
                aria-label={`移除附件：${attachmentLabel(attachment)}`}
                onClick={() =>
                  onChange(attachments.filter((item) => item.id !== attachment.id))
                }
              >
                移除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}