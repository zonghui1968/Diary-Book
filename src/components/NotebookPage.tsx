import { resolvePageTheme, type PagePattern } from '../domain/pageTheme';
import type { DiaryEntry, EntryDraft } from '../domain/types';
import { EntryEditor } from './EntryEditor';

interface NotebookPageProps {
  date: string;
  entry: DiaryEntry | undefined;
  today: string;
  /** 1-based 页码，供任务 4 的页码体系读取；本组件不渲染页码 */
  pageNumber: number;
  pageCount: number;
  onSave: (draft: EntryDraft) => void;
  onDelete: () => void;
}

/** 右上角小插图；低饱和，仅作装饰 */
function PageIllustration({ theme, label }: { theme: PagePattern; label: string }) {
  if (theme === 'plain') {
    return null;
  }
  return (
    <div
      className={`page-illustration page-illustration--${theme}`}
      title={label}
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeLinecap="round">
        {theme === 'sunny' && (
          <g strokeWidth="2">
            <circle cx="48" cy="46" r="15" />
            <path d="M48 16v8M48 68v8M18 46h8M70 46h8M27 25l6 6M63 61l6 6M69 25l-6 6M33 61l-6 6" />
          </g>
        )}
        {theme === 'cloudy' && (
          <g strokeWidth="2.2">
            <path d="M30 56c-7 0-12-5-12-11s5-11 12-11c2-8 9-13 17-13 9 0 16 6 18 14 8 0 13 5 13 11s-5 10-13 10z" />
            <path d="M58 72c-5 0-9-3.5-9-8s4-8 9-8c1.5-5 6-8 11-8 6.5 0 12 5 12 11s-5 13-12 13z" opacity=".55" />
          </g>
        )}
        {theme === 'rain' && (
          <g strokeWidth="2">
            <path d="M32 44c-8 0-14-5-14-12s6-12 14-12c2-8 9-13 17-13 10 0 17 7 19 15 8 0 13 5 13 11s-6 11-13 11z" />
            <path d="M34 58l-4 10M50 58l-4 10M66 58l-4 10" opacity=".6" />
          </g>
        )}
        {theme === 'snow' && (
          <g strokeWidth="2">
            <path d="M48 20v52M25 34l46 28M71 34L25 62" />
            <path d="M41 26l7 6 7-6M41 66l7-6 7 6M31 40l9 1 1-9M65 62l-9-1-1 9M65 40l-1 9 9 1M31 62l1-9-9-1" opacity=".65" />
          </g>
        )}
        {theme === 'wind' && (
          <g strokeWidth="2">
            <path d="M14 38h38c6 0 10-4 10-9s-4-9-10-9-10 4-10 9" />
            <path d="M14 56h52c6 0 10 4 10 9s-4 9-10 9-10-4-10-9" opacity=".7" />
            <path d="M22 72h20" opacity=".5" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * 单页日记纸：装订线、天气底纹、右上角插图，内部仍是 EntryEditor。
 * 页码只通过 data 属性透传，不渲染任何页码文本。
 */
export function NotebookPage({
  date,
  entry,
  today,
  pageNumber,
  pageCount,
  onSave,
  onDelete,
}: NotebookPageProps) {
  const theme = resolvePageTheme(entry?.weather, entry?.mood);

  return (
    <section
      className="notebook-page"
      data-page-number={pageNumber}
      data-page-count={pageCount}
    >
      <div className="page-margin" aria-hidden="true" />
      <div className={`page-pattern page-pattern--${theme.pattern}`} aria-hidden="true" />
      <PageIllustration theme={theme.illustration} label={theme.label} />
      <EntryEditor
        date={date}
        entry={entry}
        today={today}
        onSave={onSave}
        onDelete={onDelete}
      />
    </section>
  );
}