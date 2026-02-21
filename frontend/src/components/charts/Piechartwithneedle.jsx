import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useRef, useEffect, useState } from "react";

const RADIAN = Math.PI / 180;

const needle = (value, data, cx, cy, iR, oR, color) => {
  let total = 0;
  data.forEach((v) => {
    total += v.value;
  });
  const ang = 180.0 * (1 - value / total);
  const length = (iR + oR) / 4.5;
  const sin = Math.sin(-RADIAN * ang);
  const cos = Math.cos(-RADIAN * ang);
  const r = 5;
  const x0 = cx;
  const y0 = cy;
  const xba = x0 + r * sin;
  const yba = y0 - r * cos;
  const xbb = x0 - r * sin;
  const ybb = y0 + r * cos;
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;

  return [
    <circle key="circle" cx={x0} cy={y0} r={r} fill={color} stroke="none" />,
    <path
      key="path"
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill="url(#needleGradient)"
      filter="url(#shadow)"
    />,
  ];
};

const CustomTooltip = ({ active, payload, baseValue, userSpend }) => {
  function getLabel() {
    const name = payload[0].name;
    if (name === "Average") {
      return baseValue;
    } else if (name === "Above Average") {
      return baseValue + payload[0].value;
    } else {
      return baseValue + 2 * payload[0].value;
    }
  }

  if (active && payload && payload.length) {
    return (
      <div className="rounded border-black/25 bg-white/75 p-3 shadow-xl backdrop-blur">
        <div className="grid grid-cols-[max-content_1fr] gap-2">
          <div className="text-gray-500">Your Current Spending:</div>
          <div>EUR {userSpend.toFixed(2)}</div>
          <div className="text-gray-500">Global {payload[0].name} Cost:</div>
          <div>EUR {getLabel()}</div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PieChartWithNeedle({ maxFirstSegment, needleValue }) {
  const containerRef = useRef(null);

  const [computedCX, setComputedCX] = useState(0);
  const [computedCY, setComputedCY] = useState(0);
  const [computedIR, setComputedIR] = useState(0);
  const [computedOR, setComputedOR] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const width = entry.target.clientWidth;
        const height = entry.target.clientHeight;
        if (width && height) {
          setComputedCX(width * 0.5);
          setComputedCY(height * 0.75);
          setComputedIR(width * 0.5);
          setComputedOR(width);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup observer on component unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // IMPORTANT: If the name's here are changed, they also need to be changed in
  // the CustomTooltip above!
  const data = [
    { name: "Average", value: maxFirstSegment },
    {
      name: "Above Average",
      value: Math.floor(maxFirstSegment / 2),
    },
    {
      name: "High",
      value: Math.floor(maxFirstSegment / 2),
    },
  ];

  const cx = "50%";
  const cy = "75%";
  const iR = "50%";
  const oR = "100%";

  return (
    <div ref={containerRef} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="gemAverage" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="gemAboveAverage" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="gemHigh" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.4" />
              <feComponentTransfer><feFuncA type="linear" slope="0.7" /></feComponentTransfer>
            </filter>
            <radialGradient id="needleGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>
          </defs>
          <Pie
            dataKey="value"
            nameKey="name"
            startAngle={180}
            endAngle={0}
            data={data}
            cx={cx}
            cy={cy}
            innerRadius={iR}
            outerRadius={oR}
            fill="none"
            stroke="none"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  index === 0 ? "url(#gemAverage)" : index === 1 ? "url(#gemAboveAverage)" : "url(#gemHigh)"
                }
                filter="url(#shadow)"
                className="transition-all duration-300 hover:opacity-90"
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <CustomTooltip
                baseValue={maxFirstSegment}
                userSpend={needleValue}
              />
            }
          />

          {needle(
            needleValue,
            data,
            computedCX,
            computedCY,
            computedIR,
            computedOR,
            "url(#needleGradient)",
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
