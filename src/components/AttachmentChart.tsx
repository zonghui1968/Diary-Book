import type { ChartPoint } from '../domain/types';

interface AttachmentChartProps {
  points: ChartPoint[];
  chartType: 'bar' | 'line';
  title?: string;
}

const WIDTH = 320;
const HEIGHT = 160;
const PADDING = { top: 20, right: 14, bottom: 28, left: 40 };

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortLabel(label: string): string {
  return label.length > 6 ? `${label.slice(0, 5)}…` : label;
}

/** 纯展示的内联 SVG 图表；数值范围自动包含 0，负值也能正确缩放 */
export function AttachmentChart({ points, chartType, title }: AttachmentChartProps) {
  if (points.length === 0) {
    return null;
  }

  const values = points.map((point) => point.value);
  const yMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const yMax = rawMax === yMin ? yMin + 1 : rawMax;

  const plotLeft = PADDING.left;
  const plotRight = WIDTH - PADDING.right;
  const plotTop = PADDING.top;
  const plotBottom = HEIGHT - PADDING.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const slot = plotWidth / points.length;

  const yOf = (value: number) => plotTop + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const zeroY = yOf(0);
  const labelStep = points.length > 10 ? Math.ceil(points.length / 10) : 1;
  const typeLabel = chartType === 'bar' ? '柱状图' : '折线图';
  const ariaLabel = title
    ? `${title}（${typeLabel}，共 ${points.length} 项）`
    : `${typeLabel}，共 ${points.length} 项`;
  const gridValues = [yMax, (yMax + yMin) / 2, yMin];
  const linePoints = points
    .map((point, index) => `${plotLeft + slot * (index + 0.5)},${yOf(point.value)}`)
    .join(' ');

  return (
    <svg
      className="attachment-chart-svg"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>

      {gridValues.map((value) => (
        <g key={`grid-${value}`}>
          <line
            x1={plotLeft}
            y1={yOf(value)}
            x2={plotRight}
            y2={yOf(value)}
            stroke="#e6dccb"
            strokeWidth={1}
          />
          <text
            x={plotLeft - 6}
            y={yOf(value) + 3}
            textAnchor="end"
            fontSize={8}
            fill="#948a7a"
          >
            {formatValue(value)}
          </text>
        </g>
      ))}

      <line
        x1={plotLeft}
        y1={plotTop}
        x2={plotLeft}
        y2={plotBottom}
        stroke="#d6c9b2"
        strokeWidth={1}
      />
      <line
        x1={plotLeft}
        y1={zeroY}
        x2={plotRight}
        y2={zeroY}
        stroke="#b9a98d"
        strokeWidth={1}
      />

      {chartType === 'bar' ? (
        points.map((point, index) => {
          const valueY = yOf(point.value);
          const barWidth = Math.min(30, Math.max(6, slot * 0.55));
          const x = plotLeft + slot * (index + 0.5) - barWidth / 2;
          const y = Math.min(valueY, zeroY);
          const height = Math.max(1, Math.abs(valueY - zeroY));
          return (
            <rect
              key={`bar-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={height}
              rx={2}
              fill="#b4552d"
            />
          );
        })
      ) : (
        <g>
          <polyline
            points={linePoints}
            fill="none"
            stroke="#b4552d"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, index) => (
            <circle
              key={`dot-${index}`}
              cx={plotLeft + slot * (index + 0.5)}
              cy={yOf(point.value)}
              r={2.6}
              fill="#8f3f1e"
            />
          ))}
        </g>
      )}

      {points.map((point, index) =>
        index % labelStep === 0 ? (
          <text
            key={`label-${index}`}
            x={plotLeft + slot * (index + 0.5)}
            y={plotBottom + 14}
            textAnchor="middle"
            fontSize={8}
            fill="#5d5346"
          >
            {shortLabel(point.label)}
          </text>
        ) : null,
      )}
    </svg>
  );
}