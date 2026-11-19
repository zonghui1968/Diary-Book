import { FONT_OPTIONS, fontFamilyOf } from '../domain/constants';
import type { FontId } from '../domain/types';

interface FontPickerProps {
  value: FontId | undefined;
  onChange: (font: FontId | undefined) => void;
}

/** 正文字体选择：默认 + 楷书/行书/草书，按钮示例用真实字体渲染 */
export function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <div className="font-picker" role="group" aria-label="正文字体">
      <button
        type="button"
        className={`font-option${value === undefined ? ' is-active' : ''}`}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        <span className="font-option-label">默认</span>
        <span
          className="font-option-sample"
          style={{ fontFamily: fontFamilyOf(undefined) }}
          aria-hidden="true"
        >
          永和九年
        </span>
      </button>
      {FONT_OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            className={`font-option${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(option.id)}
          >
            <span className="font-option-label">{option.label}</span>
            <span
              className="font-option-sample"
              style={{ fontFamily: option.cssFamily }}
              aria-hidden="true"
            >
              {option.sample}
            </span>
          </button>
        );
      })}
    </div>
  );
}