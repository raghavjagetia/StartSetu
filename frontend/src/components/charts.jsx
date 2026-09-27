import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Validated categorical palette (see dataviz skill palette.md) — fixed order, never cycled.
export const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
export const SEQUENTIAL_BLUE = "#2a78d6";
const MUTED = "#898781";
const GRID = "#e1e0d9";

const tooltipStyle = {
  background: "#fcfcfb",
  border: "1px solid rgba(11,11,11,0.10)",
  borderRadius: 10,
  fontSize: 12,
  color: "#0b0b0b",
};

export function TrendChart({ data, dataKey = "count", xKey = "month", height = 240 }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: MUTED, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey={dataKey} stroke={SEQUENTIAL_BLUE} strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusBarChart({ data, categoryKey, valueKey = "count", height = 240 }) {
  if (!data?.length) return <EmptyChart />;
  const labeled = data.map((d, i) => ({ ...d, __color: CATEGORICAL[i % CATEGORICAL.length] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={labeled} margin={{ top: 8, right: 12, left: -18, bottom: 0 }} barCategoryGap={10}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={categoryKey} tick={{ fill: MUTED, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} className="capitalize" />
        <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]} maxBarSize={48}>
          {labeled.map((d, i) => (
            <Cell key={i} fill={d.__color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return <div className="flex h-40 items-center justify-center text-sm text-slate-400">Not enough data yet.</div>;
}
