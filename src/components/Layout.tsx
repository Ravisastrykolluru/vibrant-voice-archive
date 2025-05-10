
import React from "react";
import AnimatedBackground from "./AnimatedBackground";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  showBackground?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showBackground = true }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {showBackground && <AnimatedBackground />}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default Layout;
