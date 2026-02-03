import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  LabelList,
} from "recharts";

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#0b1020" stroke="#ffffff" />
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fontSize="9"
        fill="#ffffff"
      >
        {payload.step}
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

export default function FlowChartVisual({ data }) {
  return (
    <div className="h-[260px] w-full rounded-2xl border border-white/10 bg-[#0b1020]/90 p-4 shadow-lg shadow-black/30 sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="short"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.6)" }}
            interval={0}
          />
          <YAxis type="number" hide domain={[0.8, 1.2]} />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="flowStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <Line
            type="linear"
            dataKey="y"
            stroke="url(#flowStroke)"
            strokeWidth={3}
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
          />
          <LabelList
            dataKey="label"
            position="top"
            fill="rgba(255,255,255,0.8)"
            fontSize={10}
          />
          <ReferenceLine
            x="Invest"
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 6"
            label={{
              value: "Edge bet? Skip or Kelly",
              fill: "rgba(255,255,255,0.5)",
              fontSize: 9,
              position: "insideTopRight",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
