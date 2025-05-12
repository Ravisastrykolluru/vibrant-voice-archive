
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-4xl text-center space-y-10 relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold animate-fade-in">
            Speech Recording System
          </h1>
          
          <p className="text-xl md:text-2xl max-w-2xl mx-auto opacity-80 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Record and archive your voice in multiple languages with our intuitive platform.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center pt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Link to="/register" className="primary-btn">
              New User
            </Link>
            
            <Link to="/login" className="primary-btn">
              Returning User
            </Link>
            
            <Link to="/admin" className="primary-btn">
              Admin Login
            </Link>
          </div>
        </div>
        
        <footer className="absolute bottom-6 text-center w-full opacity-70 z-10">
          <p>© 2025 Speech Processing Lab IIIT Hyderabad. All rights reserved.</p>
        </footer>
      </div>
    </Layout>
  );
};

export default Index;
