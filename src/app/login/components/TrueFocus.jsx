"use client";

import { motion } from "framer-motion";

export default function TrueFocus({
  sentence = "",
  separator = " ",
  blurAmount = 4,
  borderColor = "#3b82f6",
  glowColor = "rgba(59,130,246,0.6)",
  animationDuration = 0.6,
  pauseBetweenAnimations = 1,
  className = "",
}) {
  const words = sentence.split(separator);

  return (
    <div className={`flex gap-2 select-none ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: `blur(${blurAmount}px)`, opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{
            duration: animationDuration,
            delay: i * (animationDuration + pauseBetweenAnimations),
          }}
          style={{
            borderBottom: `2px solid ${borderColor}`,
            paddingBottom: "4px",
            textShadow: `0 0 12px ${glowColor}`,
          }}
          className="font-bold tracking-wider text-lg"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
