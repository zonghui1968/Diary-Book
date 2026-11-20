import { forwardRef } from 'react';
import { APP_NAME, APP_TAGLINE } from '../domain/constants';

export interface BookCoverProps {
  open: boolean;
  onOpen: () => void;
}

const YEAR = new Date().getFullYear();

/** 合上的立体书封：整块封面本身就是打开书的按钮。 */
export const BookCover = forwardRef<HTMLButtonElement, BookCoverProps>(function BookCover(
  { open, onOpen },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className="book-cover"
      aria-label="打开日记本"
      aria-expanded={open}
      aria-controls="book-pages"
      aria-hidden={open}
      tabIndex={open ? -1 : 0}
      onClick={onOpen}
    >
      <span className="book-cover-edges" aria-hidden="true" />
      <span className="book-cover-spine" aria-hidden="true" />
      <span className="book-cover-face">
        <span className="book-cover-sheen" aria-hidden="true" />
        <span className="book-cover-frame">
          <span className="book-cover-kicker">私人手记</span>
          <span className="book-cover-title">{APP_NAME}</span>
          <span className="book-cover-rule" aria-hidden="true" />
          <span className="book-cover-subtitle">{APP_TAGLINE}</span>
          <span className="book-cover-year">{YEAR}</span>
        </span>
        <svg
          className="book-cover-ornament book-cover-ornament--tl"
          viewBox="0 0 44 44"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 38V18a12 12 0 0 1 12-12h20" />
          <path d="M12 38V22a10 10 0 0 1 10-10h16" />
          <circle cx="30" cy="12" r="1.6" />
        </svg>
        <svg
          className="book-cover-ornament book-cover-ornament--br"
          viewBox="0 0 44 44"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6 38V18a12 12 0 0 1 12-12h20" />
          <path d="M12 38V22a10 10 0 0 1 10-10h16" />
          <circle cx="30" cy="12" r="1.6" />
        </svg>
      </span>
      <span className="book-cover-ribbon" aria-hidden="true" />
    </button>
  );
});