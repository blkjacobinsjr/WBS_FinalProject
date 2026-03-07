import React from 'react';
import SubscriptionLogo from "../SubscriptionLogos";

function getCategoryColor(index) {
    const colors = [
        "from-orange-400 to-amber-500",
        "from-rose-400 to-red-500",
        "from-indigo-400 to-purple-500",
        "from-cyan-400 to-blue-500",
        "from-emerald-400 to-teal-500"
    ];
    return colors[index % colors.length];
}

export default function HighestSpendOrbit({ data }) {
    if (!data || data.length === 0) return null;

    // Use all data passed in (HomeTab already slices to 10)
    const displayData = data;
    const maxValue = Math.max(...displayData.map(d => d.value));

    return (
        <div className="relative w-full h-[180px] sm:h-[220px] flex items-center justify-center overflow-visible py-2">
            <div className="relative h-[80px] w-[80px] sm:h-[100px] sm:w-[100px] flex items-center justify-center">
                {/* The Sun / Center (Mascot) */}
                <div className="absolute z-10 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/80 shadow-[0_0_20px_rgba(99,102,241,0.4)] border-2 border-white/50 overflow-hidden">
                    <img src="/mascot-subzro/mascotwave.webp" alt="Subzro Mascot" className="w-full h-full object-cover p-0.5 rounded-full" />
                </div>

                {/* Orbit paths and planets */}
                {displayData.map((category, i) => {
                    const ratio = category.value / maxValue; // 0.1 to 1.0

                    // Condense orbits slightly. Hide outer ones on mobile to prevent clipping
                    const isOuter = i >= 5;
                    const distanceStep = 13;
                    const distance = 40 + (i * distanceStep);

                    // Exaggerate biggest cost to be significantly bigger
                    const sizeClass = i === 0
                        ? "h-14 w-14 sm:h-16 sm:w-16 border-2 border-white/20 z-20"
                        : "h-8 w-8 sm:h-10 sm:w-10 z-10";

                    // Very slow, peaceful, performant rotation
                    const duration = 40 + (i * 20);
                    const delay = -(i * 15);

                    const gradient = getCategoryColor(i);

                    return (
                        <div
                            key={category.name}
                            className={`absolute rounded-full border border-black/5 dark:border-white/5 ${isOuter ? 'hidden sm:block' : ''}`}
                            style={{
                                width: `${distance * 2}%`,
                                height: `${distance * 2}%`,
                                animation: `orbit-spin ${duration}s linear infinite`,
                                animationDelay: `${delay}s`,
                            }}
                        >
                            <div
                                className={`absolute -top-4 sm:-top-6 left-1/2 flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-lg ${sizeClass}`}
                                style={{
                                    animation: `orbit-spin-reverse ${duration}s linear infinite`,
                                    animationDelay: `${delay}s`,
                                }}
                                title={`${category.name}: €${category.value.toFixed(2)}`}
                            >
                                <div className="flex h-full w-full items-center justify-center rounded-full bg-white p-1.5 text-black">
                                    <SubscriptionLogo subscriptionName={category.name} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
