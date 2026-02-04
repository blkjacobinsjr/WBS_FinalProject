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
  const match = useMemo(() => {
    const safeName = (subscriptionName || "").toLowerCase();
    const nameTokens = safeName.split(/\s+/);

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
  }, [subscriptionName]);

  const derivedDomain = useMemo(() => {
    const safeName = (subscriptionName || "").toLowerCase().trim();
    if (!safeName) return null;
    if (safeName.includes(".")) {
      return safeName.replace(/https?:\/\//, "").split("/")[0];
    }
    return match.domain;
  }, [match.domain, subscriptionName]);

  const logoUrl = derivedDomain
    ? `https://img.logo.dev/${derivedDomain}?token=${logoToken}&format=png`
    : null;

  if (logoUrl && !logoError) {
    return (
      <img
        src={logoUrl}
        alt={`${subscriptionName} logo`}
        className="h-6 w-6 object-contain"
        loading="lazy"
        onError={() => setLogoError(true)}
      />
    );
  }

  return match.icon;
}
