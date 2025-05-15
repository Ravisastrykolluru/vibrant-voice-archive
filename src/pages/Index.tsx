
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import AnimatedLanguageCharacters from "@/components/AnimatedLanguageCharacters";
import ColorSplash from "@/components/ColorSplash";
import { motion } from "framer-motion";

const Index = () => {
  const { toast } = useToast();

  return (
    <Layout showBackground={false}>
      {/* Animated background elements */}
      <ColorSplash />
      <AnimatedLanguageCharacters />
      
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[#F6F6F7]/90">
        <div className="w-full max-w-4xl text-center space-y-10 relative z-10">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Speech Recording Platform
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl max-w-2xl mx-auto opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Record and archive your voice in multiple languages with our intuitive platform.
          </motion.p>
          
          <motion.div 
            className="flex flex-col md:flex-row gap-6 justify-center pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to="/register">
              <motion.button 
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors w-full md:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New User
              </motion.button>
            </Link>
            
            <Link to="/login">
              <motion.button 
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors w-full md:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Returning User
              </motion.button>
            </Link>
            
            <Link to="/admin">
              <motion.button 
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors w-full md:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Admin Login
              </motion.button>
            </Link>
          </motion.div>
        </div>
        
        <footer className="absolute bottom-6 text-center w-full opacity-70 z-10">
          <p>© 2025 Speech Processing Lab IIIT Hyderabad. All rights reserved.</p>
        </footer>
      </div>
    </Layout>
  );
};

export default Index;
