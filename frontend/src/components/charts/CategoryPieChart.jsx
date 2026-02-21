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
          <filter id="pieShadowSoft" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
          </filter>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="65%"
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          stroke="transparent"
          strokeWidth={1}
          filter="url(#pieShadowSoft)"
          paddingAngle={2}
          className="transition-all duration-300 hover:opacity-90 active:scale-95 origin-center"
        >
          {data.map((entry, index) => {
            const colors = ["#6366f1", "#ec4899", "#8b5cf6", "#14b8a6", "#f59e0b", "#3b82f6"];
            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="cursor-pointer" />;
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
