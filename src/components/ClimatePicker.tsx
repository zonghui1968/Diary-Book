import { TEMPERATURE_OPTIONS, WIND_LEVEL_OPTIONS } from '../domain/constants';
import type { TemperatureId, WindLevelId } from '../domain/types';

interface ClimatePickerProps {
  temperature: TemperatureId | undefined;
  wind: WindLevelId | undefined;
  /** null 表示取消选择 */
  onTemperatureChange: (temperature: TemperatureId | null) => void;
  /** null 表示取消选择 */
  onWindChange: (wind: WindLevelId | null) => void;
}

/**
 * 气温与风力：两组紧凑的按下态按钮，再点一次已选按钮即取消。
 * 只补充天气信息，不改变正文可读性。
 */
export function ClimatePicker({
  temperature,
  wind,
  onTemperatureChange,
  onWindChange,
}: ClimatePickerProps) {
  return (
    <>
      <div className="climate-picker" role="group" aria-label="气温">
        {TEMPERATURE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="climate-button"
            aria-pressed={temperature === option.id}
            aria-label={`气温：${option.label}`}
            title={`气温：${option.label}`}
            onClick={() =>
              onTemperatureChange(temperature === option.id ? null : option.id)
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="climate-picker" role="group" aria-label="风力">
        {WIND_LEVEL_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="climate-button"
            aria-pressed={wind === option.id}
            aria-label={`风力：${option.label}`}
            title={`风力：${option.label}`}
            onClick={() => onWindChange(wind === option.id ? null : option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}