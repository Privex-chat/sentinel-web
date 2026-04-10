/* components/charts/area-chart.tsx */
"use client";

import { useMemo } from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AreaChartProps {
  data: Array<{ name: string; value: number; [key: string]: string | number }>;
  dataKey?: string;
  xAxisKey?: string;
  color?: string;
  gradientId?: string;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
}

export function AreaChart({
  data,
  dataKey = "value",
  xAxisKey = "name",
  color = "var(--accent)",
  gradientId = "areaGradient",
  height = 200,
  showGrid = true,
  showAxis = true,
}: AreaChartProps) {
  const uniqueId = useMemo(
    () => `${gradientId}-${Math.random().toString(36).substr(2, 9)}`,
    [gradientId]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
        )}
        {showAxis && (
          <>
            <XAxis
              dataKey={xAxisKey}
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "var(--foreground)" }}
          itemStyle={{ color: "var(--foreground)" }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${uniqueId})`}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
