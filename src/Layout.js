import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils.js";
import { Home, Map, Users, MessageSquare, User, Shield } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Home") },
    { name: "Route", icon: Map, path: createPageUrl("RoutePlanner") },
    { name: "Buddy", icon: Users, path: createPageUrl("BuddyMatch") },
    { name: "Community", icon: MessageSquare, path: createPageUrl("Community") },
    { name: "Profile", icon: User, path: createPageUrl("Profile") },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F7FF] to-[#FFF] pb-20">
      <style>{`
        :root {
          --lavender: #C7B8FF;
          --midnight: #2C3E91;
          --lavender-light: #E5DFFF;
          --midnight-light: #4A5FC1;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(199, 184, 255, 0.4); }
          50% { box-shadow: 0 0 30px rgba(199, 184, 255, 0.6); }
        }
        
        .floating { animation: float 3s ease-in-out infinite; }
        .glow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-[#E5DFFF] shadow-lg z-50">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center gap-1 transition-all duration-300 group"
                >
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      active
                        ? "bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] shadow-lg"
                        : "hover:bg-[#F5F2FF]"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        active ? "text-white" : "text-[#2C3E91] group-hover:text-[#4A5FC1]"
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      active ? "text-[#2C3E91]" : "text-gray-500 group-hover:text-[#4A5FC1]"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}