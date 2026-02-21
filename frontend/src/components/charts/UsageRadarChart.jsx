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
        <PolarGrid stroke="rgba(0,0,0,0.1)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: "12px", fontWeight: "bold" }}
        />
        <Radar
          name="Total Cost"
          dataKey="totalCost"
          stroke="#ec4899"
          strokeWidth={2}
          fill="#ec4899"
          fillOpacity={0.6}
        />
        <Radar
          name="Score"
          dataKey="categoryScore"
          stroke="#6366f1"
          strokeWidth={2}
          fill="#6366f1"
          fillOpacity={0.7}
          domain={[1, 5]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
