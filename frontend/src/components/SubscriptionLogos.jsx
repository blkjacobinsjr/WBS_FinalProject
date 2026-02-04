import { useMemo, useState } from "react";
import {
  FaSpotify,
  FaAmazon,
  FaYoutube,
  FaPlaystation,
  FaXbox,
  FaMoneyCheckAlt,
  FaAudible,
  FaItunesNote,
} from "react-icons/fa";

import { RiNetflixFill, RiAppleFill } from "react-icons/ri";

import { TbBrandDisney } from "react-icons/tb";

export default function SubscriptionLogo({ subscriptionName }) {
  const [logoError, setLogoError] = useState(false);
  const defaultIcon = <FaMoneyCheckAlt />;
  const logoToken = "pk_fg7nZQ2oQQK-tZnjxKWfPQ";
  const domainAliases = {
    openai: "openai.com",
    anthropic: "anthropic.com",
    google: "google.com",
    xai: "x.ai",
    youtube: "youtube.com",
    apple: "apple.com",
    amazon: "amazon.com",
    netflix: "netflix.com",
    spotify: "spotify.com",
    disney: "disneyplus.com",
    microsoft: "microsoft.com",
    github: "github.com",
    notion: "notion.so",
    slack: "slack.com",
    zoom: "zoom.us",
    replicate: "replicate.com",
    replit: "replit.com",
  };
  const suffixWords = [
    "workspace",
    "cloud",
    "suite",
    "music",
    "premium",
    "plus",
    "pro",
    "app",
    "service",
    "membership",
  ];

  const icons = [
    {
      name: "Spotify",
      tags: ["spotify", "spot"],
      icon: <FaSpotify />,
      domain: "spotify.com",
    },
    {
      name: "Amazon Prime",
      tags: ["amazon", "prime"],
      icon: <FaAmazon />,
      domain: "amazon.com",
    },
    {
      name: "YouTube Premium",
      tags: ["youtube", "yt", "premium"],
      icon: <FaYoutube />,
      domain: "youtube.com",
    },
    {
      name: "Xbox Gamepass",
      tags: ["xbox", "gamepass", "game pass", "gold"],
      icon: <FaXbox />,
      domain: "xbox.com",
    },
    {
      name: "PlayStation+",
      tags: ["playstation", "psn", "ps+"],
      icon: <FaPlaystation />,
      domain: "playstation.com",
    },
    {
      name: "Audible",
      tags: ["audible"],
      icon: <FaAudible />,
      domain: "audible.com",
    },
    {
      name: "Netflix",
      tags: ["netflix"],
      icon: <RiNetflixFill />,
      domain: "netflix.com",
    },
    {
      name: "Apple Music",
      tags: ["apple music", "itunes"],
      icon: <FaItunesNote />,
      domain: "apple.com",
    },
    {
      name: "Apple One",
      tags: ["apple one"],
      icon: <RiAppleFill />,
      domain: "apple.com",
    },
    {
      name: "Disney+",
      tags: ["disney"],
      icon: <TbBrandDisney />,
      domain: "disneyplus.com",
    },
  ];

  // try matching our icon list with the name of th subscription
  const normalizedName = useMemo(() => {
    return (subscriptionName || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, [subscriptionName]);

  const match = useMemo(() => {
    const nameTokens = normalizedName.split(/\s+/).filter(Boolean);

    return icons.reduce(
      (bestMatch, iconMeta) => {
        const overlap = iconMeta.tags.filter((tag) =>
          nameTokens.includes(tag),
        ).length;
        return overlap > bestMatch.overlap
          ? { overlap, icon: iconMeta.icon, domain: iconMeta.domain }
          : bestMatch;
      },
      { overlap: 0, icon: defaultIcon, domain: null },
    );
  }, [defaultIcon, normalizedName]);

  const derivedDomain = useMemo(() => {
    if (!normalizedName) return null;
    if (normalizedName.includes(".")) {
      return normalizedName.replace(/https?:\/\//, "").split("/")[0];
    }

    if (match.domain) return match.domain;

    const tokens = normalizedName.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;

    const primary =
      tokens.length > 1 && suffixWords.includes(tokens[tokens.length - 1])
        ? tokens[0]
        : tokens.join("");

    if (domainAliases[primary]) return domainAliases[primary];

    return `${primary}.com`;
  }, [domainAliases, match.domain, normalizedName]);

  const logoUrl = derivedDomain
    ? `https://img.logo.dev/${derivedDomain}?token=${logoToken}&format=png`
    : null;

  if (logoUrl && !logoError) {
    return (
      <img
        src={logoUrl}
        alt={`${subscriptionName} logo`}
        className="h-6 w-6 rounded-lg object-contain"
        loading="lazy"
        onError={() => setLogoError(true)}
      />
    );
  }

  return match.icon;
}
