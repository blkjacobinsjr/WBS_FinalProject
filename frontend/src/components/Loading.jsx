import "daisyui/dist/full.css";
import { useEffect, useState } from "react";

const FRAME_INTERVAL_MS = 110;
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

export default function Loading() {
  const INTERVAL_TIME_SECONDS = 3;

  const [message, setMessage] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);

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
      <div className="relative h-24 w-24 rounded-full border-4 border-white/60 bg-white/60 p-1 shadow-lg">
        <img
          src={mascotLoopFrames[frameIndex]}
          alt="Subzro mascot loading"
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      <div className="p-6 text-black/50">{message}</div>
    </div>
  );
}
