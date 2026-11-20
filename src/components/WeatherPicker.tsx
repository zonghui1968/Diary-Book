import { isWeatherId, WEATHER_OPTIONS } from '../domain/constants';
import type { WeatherId } from '../domain/types';

interface WeatherPickerProps {
  value: WeatherId | undefined;
  /** null 表示明确清除天气 */
  onChange: (weather: WeatherId | null) => void;
}

/** 原生下拉：紧凑、可用键盘选择，与字体/心情工具并排 */
export function WeatherPicker({ value, onChange }: WeatherPickerProps) {
  return (
    <label className="weather-picker">
      <span className="weather-picker-label">天气</span>
      <select
        className="weather-select"
        aria-label="当天天气"
        value={value ?? ''}
        onChange={(event) => {
          const next = event.target.value;
          onChange(isWeatherId(next) ? next : null);
        }}
      >
        <option value="">不指定</option>
        {WEATHER_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.emoji} {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}