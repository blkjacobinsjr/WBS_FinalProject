import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useRef, useEffect, useState } from "react";

const RADIAN = Math.PI / 180;

const needle = (value, data, cx, cy, iR, oR, color) => {
  let total = 0;
  data.forEach((v) => {
    total += v.value;
  });

  // Clamp value to total so needle doesn't break
  const clampedValue = Math.min(value, total);
  const ang = 180.0 * (1 - clampedValue / total);
  const length = Math.max(oR * 0.85, 20);
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

  const CirclePulse = () => (
    <g>
      <circle cx={xp} cy={yp} r={6} fill={color} />
      <circle cx={xp} cy={yp} r={6} fill={color}>
        <animate
          attributeName="r"
          values="6;14;6"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );

  return [
    <circle key="circle" cx={x0} cy={y0} r={r} fill={color} stroke="none" />,
    <path
      key="path"
      d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
      stroke="none"
      fill="#475569"
      style={{ filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" }}
    />,
    <CirclePulse key="pulse" />,
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
          // Force center to be near the bottom wrapper edge (minus few px for margin)
          const cy = height - 15;
          // Radius should fit within half-width or total available height
          const maxRadius = Math.min(width * 0.45, cy * 0.9);

          setComputedCX(width * 0.5);
          setComputedCY(cy);
          setComputedOR(maxRadius);
          setComputedIR(maxRadius * 0.65);
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

  return (
    <div ref={containerRef} className="h-full w-full flex items-center justify-center">
      {computedCX > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="value"
              nameKey="name"
              startAngle={180}
              endAngle={0}
              data={data}
              cx={computedCX}
              cy={computedCY}
              innerRadius={computedIR}
              outerRadius={computedOR}
              fill="none"
              stroke="none"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === 0 ? "#10b981" : index === 1 ? "#f59e0b" : "#ef4444"
                  }
                  className="transition-all duration-300 hover:opacity-80"
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
              "#475569",
            )}
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
