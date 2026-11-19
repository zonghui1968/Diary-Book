import { FONT_OPTIONS, fontFamilyOf, isFontId } from '../domain/constants';
import type { FontId } from '../domain/types';

interface FontPickerProps {
  value: FontId | undefined;
  onChange: (font: FontId | undefined) => void;
}

/** 正文字体选择：紧凑下拉，右侧用真实字体即时预览当前选择 */
export function FontPicker({ value, onChange }: FontPickerProps) {
  return (
    <label className="font-picker font-select">
      <span className="font-select-label">字体</span>
      <select
        aria-label="正文字体"
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value;
          onChange(isFontId(next) ? next : undefined);
        }}
      >
        <option value="">默认</option>
        {FONT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="font-select-preview"
        style={{ fontFamily: fontFamilyOf(value) }}
        aria-hidden="true"
      >
        永和九年
      </span>
    </label>
  );
}