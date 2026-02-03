import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
} from "recharts";

function CustomDot(props) {
  const { cx, cy, payload, index } = props;
  if (!cx || !cy) return null;
  const dy = index % 2 === 0 ? -14 : 18;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#ffffff" opacity={0.9} />
      <circle cx={cx} cy={cy} r={10} fill="rgba(255,255,255,0.15)" />
      <text
        x={cx}
        y={cy + dy}
        textAnchor="middle"
        fontSize="10"
        fill="rgba(255,255,255,0.85)"
        style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        {payload.short}
      </text>
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-white shadow-lg">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
        {item.label}
      </div>
      <div className="mt-1 text-sm font-semibold">{item.metric}</div>
      <div className="mt-1 text-[10px] text-white/60">{item.body}</div>
    </div>
  );
}

export default function FlowChartVisual({ data, branch }) {
  return (
    <div className="h-[260px] w-full rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 shadow-lg shadow-black/30 sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="step" type="number" hide />
          <YAxis type="number" hide domain={[0.6, 3.4]} />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="flowStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="y"
            stroke="url(#flowStroke)"
            strokeWidth={3}
            dot={false}
            activeDot={false}
          />
          {branch?.length > 0 && (
            <Line
              data={branch}
              type="monotone"
              dataKey="y"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={2}
              strokeDasharray="4 6"
              dot={false}
              activeDot={false}
            />
          )}
          <Scatter data={data} shape={<CustomDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
