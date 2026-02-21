import { useEffect, useRef, useState, useMemo } from 'react';
import { ResponsiveContainer } from 'recharts';

function getCategoryColor(index) {
    const colors = [
        "from-rose-400 to-red-500",
        "from-blue-400 to-indigo-500",
        "from-emerald-400 to-green-500",
        "from-amber-400 to-orange-500",
        "from-fuchsia-400 to-purple-500",
        "from-cyan-400 to-blue-500",
    ];
    return colors[index % colors.length];
}

function getDomainFromName(name) {
    const domainMap = {
        "netflix": "netflix.com",
        "spotify": "spotify.com",
        "amazon": "amazon.com",
        "hulu": "hulu.com",
        "disney": "disneyplus.com",
        "apple": "apple.com",
        "youtube": "youtube.com",
        "chatgpt": "openai.com",
        "claude": "anthropic.com",
        "gym": "planetfitness.com",
        "hbo": "max.com",
        "strava": "strava.com",
        "duolingo": "duolingo.com",
        "notion": "notion.so",
        "github": "github.com",
        "xbox": "xbox.com",
        "playstation": "playstation.com",
        "discord": "discord.com"
    };

    const lowercaseName = name.toLowerCase();
    for (const [key, domain] of Object.entries(domainMap)) {
        if (lowercaseName.includes(key)) return domain;
    }
    // Fallback: strip spaces and add .com
    return lowercaseName.replace(/[^a-z0-9]/g, '') + '.com';
}

export default function HighestSpendOrbit({ data }) {
    const maxSpend = Math.max(...data.map(d => d.value), 1);

    // Sort data descending so biggest is in the center or first
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <div className="relative w-full h-[250px] flex items-center justify-center overflow-hidden">
            {/* Central Star - Total Spend? */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_40px_rgba(245,158,11,0.5)] z-10 flex items-center justify-center">
                <span className="text-xl">💰</span>
            </div>

            {sortedData.map((category, i) => {
                // Calculate size based on value relative to max (min 20px, max 45px)
                const sizeRatio = category.value / maxSpend;
                const size = 20 + (sizeRatio * 25);

                // Calculate orbit parameters
                // Distance from center (orbit radius)
                const minRadius = i === 0 ? 35 : 35 + (i * 18);
                const radius = Math.min(minRadius, 75);

                // Animation duration mapped to radius inversely, bigger radius -> slower
                const duration = 10 + (i * 8);

                // Stagger animations
                const delay = -(i * 12);

                const domain = getDomainFromName(category.name);
                const logoUrl = `https://logo.clearbit.com/${domain}`;
                const gradient = getCategoryColor(i);

                // Allow using either value or price from the dataset depending on what is passed
                const itemValue = category.value || category.price || 0;

                return (
                    <div
                        key={category.name}
                        className="absolute top-1/2 left-1/2"
                        style={{
                            width: `${radius * 2}px`,
                            height: `${radius * 2}px`,
                            marginLeft: `-${radius}px`,
                            marginTop: `-${radius}px`,
                            animation: `spin ${duration}s linear infinite`,
                            animationDelay: `${delay}s`,
                        }}
                    >
                        {/* Draw the faint orbit ring */}
                        <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5" />

                        {/* Invert the spin on the item so the text stays upright */}
                        <div
                            className={`absolute top-0 left-1/2 rounded-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} shadow-lg backdrop-blur cursor-pointer hover:scale-110 transition-transform`}
                            style={{
                                width: `${size}px`,
                                height: `${size}px`,
                                marginLeft: `-${size / 2}px`,
                                marginTop: `-${size / 2}px`,
                                animation: `spin-reverse ${duration}s linear infinite`,
                                animationDelay: `${delay}s`,
                            }}
                            title={`${category.name}: €${category.value || category.price}`}
                        >
                            <img
                                src={logoUrl}
                                alt={category.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                                className="w-full h-full object-cover rounded-full p-1"
                            />
                            {/* Fallback initial if image fails */}
                            <span className="text-white font-bold hidden absolute inset-0 items-center justify-center">
                                {category.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                );
            })}

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
        </div>
    );
}
