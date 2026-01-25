import { useRef } from 'react';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  x: number | string; // Label (e.g., date or category)
  y: number; // Value
}

interface NeonGlowChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  colorStart?: string; // Gradient start color
  colorEnd?: string; // Gradient end color
}

export default function NeonGlowChart({
  data,
  width = 300,
  height = 200,
  colorStart = '#A78BFA', // Purple
  colorEnd = '#F472B6', // Pink
}: NeonGlowChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Calculate chart dimensions and scaling
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxY = Math.max(...data.map(d => d.y), 0);
  const minY = Math.min(...data.map(d => d.y), 0);
  const yRange = maxY - minY || 1; // Avoid division by zero

  // Generate smooth path for line chart
  const generatePath = () => {
    if (data.length === 0) return '';

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      return { x, y };
    });

    // Create smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const controlX = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x} ${prev.y}, ${controlX} ${(prev.y + curr.y) / 2}`;
      path += ` T ${curr.x} ${curr.y}`;
    }

    return path;
  };

  const pathData = generatePath();

  return (
    <div className="relative" style={{ width, height }}>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated line path */}
        <motion.path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke="url(#chartGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1, ease: 'easeInOut' },
            opacity: { duration: 0.5 },
          }}
        />

        {/* Key node numbers (sparse labels) */}
        {data.length > 0 && (
          <>
            {data.map((point, index) => {
              // Only show labels for first, middle, and last points
              if (
                index !== 0 &&
                index !== Math.floor(data.length / 2) &&
                index !== data.length - 1
              ) {
                return null;
              }

              const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
              const y = padding + chartHeight - ((point.y - minY) / yRange) * chartHeight;

              return (
                <g key={index}>
                  {/* Data point circle */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={colorEnd}
                    filter="url(#glow)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  />
                  {/* Label */}
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    fill="#8B5A7A"
                    style={{ fontSize: '12px' }}
                  >
                    {point.y}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}
