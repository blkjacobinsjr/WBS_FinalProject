import CategoryIcon from "./CategoryIcon";
import { Link } from "react-router-dom";

export default function CategoryButton({ category, to }) {
  return (
    <Link
      to={to}
      className="btn-press tap-target-44 interactive-hover-bg flex w-full flex-row items-center justify-start gap-4 rounded-lg p-4 shadow-none outline-none focus:ring-2 [--hover-bg:rgba(255,255,255,0.5)]"
    >
      <CategoryIcon icon={category.icon} />
      <div>{category.name}</div>
    </Link>
  );
}
