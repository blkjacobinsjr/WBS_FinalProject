import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useDataContext } from "../../contexts/dataContext";
import { filterByCategory } from "../../utils/filterHelper";

export default function CategoryRadarChart({ categoryId }) {
  const { subscriptions } = useDataContext();

  const filteredSubscriptions = filterByCategory(subscriptions, categoryId);

  // TODO: Should this use the maximum score or the average score for the axis

  const data = filteredSubscriptions.map((subscription) => {
    return {
      name: subscription.name,
      price: subscription.price,
      score: subscription.score,
    };
  });

  // TODO: Hide charts if too few subscriptions are in category / have been rated
  return (
    <>
      <ResponsiveContainer width="100%" height={300} minHeight={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
          <PolarGrid />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: "12px" }}
          />
          <Radar
            name="Price"
            dataKey="price"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.5}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.75}
            domain={[1, 5]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </>
  );
}
