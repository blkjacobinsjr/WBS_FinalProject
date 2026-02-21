import { useState } from "react";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, activePie }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    if (activePie === "outer") {
      return (
        <div className="rounded border-black/25 bg-white/75 p-3 shadow-xl backdrop-blur">
          <div className="grid grid-cols-[max-content_1fr] gap-2">
            <div>Category:</div>
            <div>{data.name}</div>
            <div>Total Cost:</div>
            <div>EUR {data.value.toFixed(2)}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="rounded border-black/25 bg-white/75 p-3 shadow-xl backdrop-blur">
          {data.subscriptions.map((sub) => (
            <div key={sub._id} className="flex flex-col">
              <div className="text-sm">Subscription: {sub.name}</div>
              <div className="flex flex-row gap-4 text-xs text-gray-500">
                <div>Price: EUR {sub.price.toFixed(2)}</div>
                <div>Score: {sub.score.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }
  return null;
};

export default function UsedCategoriesPieChart({ pieData }) {
  const [activePie, setActivePie] = useState();

  return (
    <ResponsiveContainer>
      <PieChart>
        <defs>
          <linearGradient id="innerGem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="outerGem" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.5" />
          </filter>
        </defs>
        {/* Inner Ring: Subscriptions */}
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={50}
          fill="url(#innerGem)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          filter="url(#pieShadow)"
          onMouseEnter={() => setActivePie("inner")}
          onMouseLeave={() => setActivePie(null)}
        >
          {[].map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        {/* Outer Ring: Categories */}
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          fill="url(#outerGem)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          filter="url(#pieShadow)"
          paddingAngle={3}
          labelLine={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            percent,
            name,
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = 25 + innerRadius + (outerRadius - innerRadius);
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <text
                x={x}
                y={y}
                fill="black"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                className="text-xs font-bold text-gray-800"
              >
                {name} ({(percent * 100).toFixed(0)}%)
                {/* {`${(percent * 100).toFixed(0)}%`} */}
              </text>
            );
          }}
          onMouseEnter={() => setActivePie("outer")}
          onMouseLeave={() => setActivePie(null)}
        />
        <Tooltip content={<CustomTooltip activePie={activePie} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
