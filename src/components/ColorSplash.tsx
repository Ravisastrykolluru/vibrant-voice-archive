
import React from "react";
import { motion } from "framer-motion";

const ColorSplash: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Holi-style color splashes around the edges */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #FF5733 0%, #FFC300 100%)" }}
        animate={{
          scale: [1, 1.2, 1],
          x: [-30, -20, -30],
          y: [-30, -20, -30],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />
      
      <motion.div
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #33FF57 0%, #00FFCA 100%)" }}
        animate={{
          scale: [1, 1.3, 1],
          x: [30, 20, 30],
          y: [-30, -20, -30],
        }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "reverse", delay: 1 }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #3357FF 0%, #33FFF9 100%)" }}
        animate={{
          scale: [1, 1.2, 1],
          x: [-30, -20, -30],
          y: [30, 20, 30],
        }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", delay: 2 }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #F033FF 0%, #FC33FF 100%)" }}
        animate={{
          scale: [1, 1.1, 1],
          x: [30, 20, 30],
          y: [30, 20, 30],
        }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", delay: 3 }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #FF9933 0%, #FFCC33 100%)" }}
        animate={{
          scale: [1, 1.3, 1],
          x: [-50, -40, -50],
          y: [-50, -40, -50],
        }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "reverse", delay: 4 }}
      />
      
      <motion.div
        className="absolute top-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl opacity-10"
        style={{ background: "linear-gradient(135deg, #E033FF 0%, #33B1FF 100%)" }}
        animate={{
          scale: [1, 1.2, 1],
          x: [50, 40, 50],
          y: [-50, -40, -50],
        }}
        transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", delay: 5 }}
      />
    </div>
  );
};

export default ColorSplash;
