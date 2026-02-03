import CategoryButton from "./CategoryButton";
import { useDataContext } from "../contexts/dataContext";

export default function SidebarTop({ className = "w-full" }) {
  const { subscriptions } = useDataContext();

  const sidebarTopLinks = [
    {
      name: "Dashboard",
      icon: {
        path: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      to: "/dashboard",
    },
    {
      name: "Recommendations",
      icon: {
        path: "M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      to: "/dashboard/recommendations",
    },
    {
      name: "Usage",
      icon: [
        {
          path: "M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        {
          path: "M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
      ],
      to: "/dashboard/usage",
    },
    {
      name: "Bulk Import",
      icon: {
        path: "M12 3v9m0 0l-3-3m3 3l3-3m-6 9h12a2.25 2.25 0 002.25-2.25V9.75a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25v6.75A2.25 2.25 0 006 18z",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      to: "/dashboard/bulk",
    },
    {
      name: "Insights",
      icon: {
        path: "M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      to: "/dashboard/insights",
    },
  ];

  return (
    <div className={className}>
      {sidebarTopLinks.map((link) => (
        <CategoryButton key={link.name} category={link} to={link.to} />
      ))}
    </div>
  );
}
