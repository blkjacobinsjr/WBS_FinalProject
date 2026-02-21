import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useDataContext } from "../../contexts/dataContext";

export default function UsageRadarChart() {
  const { usedCategories } = useDataContext();

  const data = usedCategories?.map((category) => {
    return {
      name: category.name,
      totalCost: category.totalCost,
      categoryScore: category.categoryScore,
    };
  });

  // TODO: Hide charts if too few subscriptions are in category / have been rated
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
        <defs>
          <linearGradient id="costGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#881337" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="scoreGradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#0369a1" stopOpacity={0.8} />
          </linearGradient>
          <filter id="radarShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="15" floodOpacity="0.4" />
          </filter>
        </defs>
        <PolarGrid stroke="rgba(0,0,0,0.1)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: "12px", fontWeight: "bold" }}
        />
        <Radar
          name="Total Cost"
          dataKey="totalCost"
          stroke="url(#costGradient)"
          strokeWidth={3}
          fill="url(#costGradient)"
          fillOpacity={0.7}
          filter="url(#radarShadow)"
        />
        <Radar
          name="Score"
          dataKey="categoryScore"
          stroke="url(#scoreGradient)"
          strokeWidth={3}
          fill="url(#scoreGradient)"
          fillOpacity={0.8}
          filter="url(#radarShadow)"
          domain={[1, 5]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
