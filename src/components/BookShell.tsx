import { useEffect, useRef, type ReactNode } from 'react';
import { BookCover } from './BookCover';

export interface BookShellProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  pageNumber: number;
  pageCount: number;
  children: ReactNode;
}

/** 合上时不进入无障碍树、不可聚焦；React 18 的类型里没有 inert，用属性透传。 */
const INERT_ATTR: Record<string, string> = { inert: '' };

/**
 * 立体日记本舞台：始终渲染封面 + 内页，靠 data-open 切换打开/关闭动画。
 * 内页在合上时 aria-hidden + inert，打开后只做淡入，不接管翻页动画。
 */
export function BookShell({
  open,
  onOpen,
  onClose,
  pageNumber,
  pageCount,
  children,
}: BookShellProps) {
  const coverRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  // 焦点跟随状态，避免焦点停在 aria-hidden 的封面上
  useEffect(() => {
    if (wasOpen.current === open) {
      return;
    }
    wasOpen.current = open;
    if (open) {
      closeRef.current?.focus();
    } else {
      coverRef.current?.focus();
    }
  }, [open]);

  return (
    <div className={`book-stage${open ? ' is-open' : ''}`} data-open={open ? 'true' : 'false'}>
      <div
        className="book-pages"
        id="book-pages"
        aria-hidden={!open}
        {...(open ? {} : INERT_ATTR)}
      >
        <div className="book-pages-spread">{children}</div>
      </div>

      <BookCover ref={coverRef} open={open} onOpen={onOpen} />

      <div
        className="book-pages-chrome"
        aria-hidden={!open}
        {...(open ? {} : INERT_ATTR)}
      >
        <span className="page-number" aria-live="polite">
          第 {pageNumber} 页 / 共 {pageCount} 页
        </span>
        <button
          ref={closeRef}
          type="button"
          className="book-close"
          aria-label="合上日记本"
          onClick={onClose}
        >
          合上日记本
        </button>
      </div>
    </div>
  );
}