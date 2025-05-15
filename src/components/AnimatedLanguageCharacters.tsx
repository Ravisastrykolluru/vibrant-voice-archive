
import React from "react";
import { motion } from "framer-motion";

// Languages to display as floating characters
const languages = [
  { text: "हिन्दी", color: "#FF5733" }, // Hindi
  { text: "తెలుగు", color: "#33FF57" }, // Telugu
  { text: "ಕನ್ನಡ", color: "#3357FF" }, // Kannada
  { text: "தமிழ்", color: "#F033FF" }, // Tamil
  { text: "മലയാളം", color: "#FF9933" }, // Malayalam
  { text: "English", color: "#33FFF9" },
  { text: "অসমীয়া", color: "#E033FF" }, // Assamese
  { text: "বাংলা", color: "#33FFB1" }, // Bengali
  { text: "ଓଡ଼ିଆ", color: "#FFF533" }, // Odia
];

const AnimatedLanguageCharacters: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {languages.map((lang, index) => (
        <motion.div
          key={index}
          className="absolute text-3xl md:text-5xl font-bold opacity-20"
          initial={{
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: [
              `${Math.random() * 100}vw`,
              `${Math.random() * 100}vw`,
              `${Math.random() * 100}vw`,
            ],
            y: [
              `${Math.random() * 100}vh`,
              `${Math.random() * 100}vh`,
              `${Math.random() * 100}vh`,
            ],
            rotate: [0, 180, 360],
            scale: [Math.random() * 0.5 + 0.5, Math.random() * 0.8 + 0.7, Math.random() * 0.5 + 0.5],
          }}
          transition={{
            duration: Math.random() * 50 + 30,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ color: lang.color }}
        >
          {lang.text}
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedLanguageCharacters;
