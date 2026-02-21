import { useEffect, useState } from "react";

const FRAME_INTERVAL_MS = 110;
const INTERVAL_TIME_SECONDS = 3;

const mascotLoopFrames = [
  "/mascot-subzro/mascotmove1.webp",
  "/mascot-subzro/mascotmove2.webp",
  "/mascot-subzro/mascotmove3.webp",
  "/mascot-subzro/mascotmove4.webp",
  "/mascot-subzro/mascotmove5.webp",
  "/mascot-subzro/mascotmove6.webp",
  "/mascot-subzro/mascotmove7.webp",
  "/mascot-subzro/mascotmove8.webp",
  "/mascot-subzro/mascotmove9.webp",
  "/mascot-subzro/mascotmove10.webp",
  "/mascot-subzro/mascotmove12.webp",
  "/mascot-subzro/mascotwave.webp",
];

const loadingMessages = [
  "Fetching your subscriptions...",
  "Fetching your subscriptions...",
  "Fetching your subscriptions...",
  "Fetching your subscriptions...",
  "Fetching notifications...",
  "Fetching notifications...",
  "Fetching usage data...",
  "Fetching usage data...",
  "Fetching category data...",
  "Fetching category data...",
  "Drawing visualisation...",
  "Drawing visualisation...",
  "Looking for that notification that fell under the couch...",
  "Paying fetch with the dog...",
  "Lost one of the charts, redrawing from memory...",
];

export default function Loading() {
  const [message, setMessage] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    function pickRandomMessage() {
      const randomMsg =
        loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setMessage(randomMsg);
    }

    pickRandomMessage();

    const interval = setInterval(
      pickRandomMessage,
      INTERVAL_TIME_SECONDS * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((current) => (current + 1) % mascotLoopFrames.length);
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white/60 bg-white/60 shadow-lg">
        <div className="absolute inset-0 p-1">
          {mascotLoopFrames.map((frame, index) => (
            <img
              key={frame}
              src={frame}
              alt="Subzro mascot loading"
              className={`absolute left-0 top-0 h-full w-full rounded-full object-cover transition-none ${index === frameIndex ? "opacity-100 relative" : "opacity-0 pointer-events-none"
                }`}
              loading="eager"
              decoding="async"
            />
          ))}
        </div>
      </div>
      <div className="p-6 text-black/50">{message}</div>
    </div>
  );
}
