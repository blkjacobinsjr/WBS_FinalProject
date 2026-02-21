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
          <radialGradient id="silverGem" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
          <linearGradient id="roseGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
          <linearGradient id="emerald" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id="amethyst" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>
          <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="15" floodOpacity="0.4" />
          </filter>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="60%"
          fill="url(#silverGem)"
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
          filter="url(#pieShadow)"
          paddingAngle={3}
        >
          {data.map((entry, index) => {
            const colors = ["url(#silverGem)", "url(#roseGold)", "url(#emerald)", "url(#amethyst)"];
            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
