import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useDataContext } from "../../contexts/dataContext";
import { filterByCategory } from "../../utils/filterHelper";

export default function CategoryPieChart({ categoryId }) {
  const { subscriptions } = useDataContext();
  const filteredSubscriptions = filterByCategory(subscriptions, categoryId);

  const data = filteredSubscriptions.map((subscription) => {
    return {
      name: subscription.name,
      value: subscription.monthlyPrice,
    };
  });

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, outerRadius, payload } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 10;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percent = ((payload.value / total) * 100).toFixed(0);

    return (
      <text
        x={x}
        y={y}
        fill="#6b7280"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="middle"
      >
        <tspan x={x} dy="0">
          {payload.name}
        </tspan>
        <tspan x={x} dy="15">
          EUR {payload.value.toFixed(2)} ({percent}%)
        </tspan>
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          <filter id="ultimateGem" x="-20%" y="-20%" width="140%" height="140%">
            {/* Drop shadow */}
            <feDropShadow dx="0" dy="12" stdDeviation="18" floodColor="#000" floodOpacity="0.45" result="shadow" />
            {/* Inner Bevel highlight mimicking sharp crystal cuts */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.2" specularExponent="20" lightingColor="white" result="specOut">
              <feDistantLight elevation="60" azimuth="-45" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specMasked" />
            {/* Soft inner shadow for volume */}
            <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blurInner" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="#000" floodOpacity="0.25" result="shadowColor" />
            <feComposite in="shadowColor" in2="shadowDiff" operator="in" result="innerShadow" />
            {/* Combine shape + specular + inner shadow */}
            <feComposite in="SourceGraphic" in2="specMasked" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="beveled" />
            <feComposite in="beveled" in2="innerShadow" operator="over" result="finalShape" />
            {/* Layer final over the shadow */}
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="finalShape" />
            </feMerge>
          </filter>
          <radialGradient id="amethystGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="40%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>
          <radialGradient id="roseGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="40%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#be123c" />
          </radialGradient>
          <radialGradient id="sapphireGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
          <radialGradient id="silverGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
          <radialGradient id="emeraldGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="40%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="65%"
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={1}
          filter="url(#ultimateGem)"
          paddingAngle={4}
          className="transition-all duration-300 hover:opacity-90 active:scale-95 origin-center"
        >
          {data.map((entry, index) => {
            const colors = ["url(#amethystGlow)", "url(#sapphireGlow)", "url(#roseGlow)", "url(#silverGlow)", "url(#emeraldGlow)"];
            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="cursor-pointer" />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
