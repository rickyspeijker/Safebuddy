
import React, { useState, useEffect } from "react";
import { base44 } from "../api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Shield, MapPin, Users, MessageSquare, AlertCircle, CheckCircle, Moon, Sparkles } from "lucide-react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import EmergencyButton from "../Components/EmergencyButton";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    loadUser();
    setGreetingMessage();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  };

  const quickActions = [
    {
      title: "Plan Safe Route",
      description: "AI-powered route with safety insights",
      icon: MapPin,
      color: "from-[#C7B8FF] to-[#A99EE8]",
      path: "RoutePlanner",
    },
    {
      title: "Find a Buddy",
      description: "Match with someone on your route",
      icon: Users,
      color: "from-[#4A5FC1] to-[#2C3E91]",
      path: "BuddyMatch",
    },
    {
      title: "Community Reports",
      description: "See and share safety updates",
      icon: MessageSquare,
      color: "from-[#A99EE8] to-[#8B7ED8]",
      path: "Community",
    },
  ];

  const getFirstName = (fullName) => {
    if (!fullName) return "Friend";
    const parts = fullName.split(" ");
    return parts[0] || "Friend";
  };

  return (
    <div className="min-h-screen">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-br from-[#2C3E91] via-[#4A5FC1] to-[#C7B8FF] pt-12 pb-32 px-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl floating" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-[#C7B8FF]/20 rounded-full blur-3xl floating" style={{ animationDelay: "1s" }} />
        
        <div className="relative max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">{greeting}</p>
              <h1 className="text-white text-3xl font-bold">
                {getFirstName(user?.full_name)} ✨
              </h1>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          <Card className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-xl border-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">You're Safe</p>
                <p className="text-xs text-gray-600">No active alerts in your area</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
              <Moon className="w-3.5 h-3.5" />
              <span>Stay alert - traveling at night</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-md mx-auto px-6 -mt-20 relative z-10">
        <div className="space-y-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.title}
                onClick={() => navigate(createPageUrl(action.path))}
                className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-0 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center shadow-lg glow`}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-0.5">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <div className="w-8 h-8 bg-[#F5F2FF] rounded-full flex items-center justify-center">
                    <span className="text-[#2C3E91]">→</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Safety Tips */}
        <Card className="bg-gradient-to-br from-[#F5F2FF] to-white p-5 rounded-2xl border border-[#E5DFFF] mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD6A5] to-[#FFA94D] rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Safety Tip</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Always let someone know where you're going. Use the buddy system when possible, and trust your instincts.
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white p-4 rounded-xl text-center border-0 shadow-md">
            <p className="text-2xl font-bold text-[#2C3E91] mb-1">24</p>
            <p className="text-xs text-gray-600">Safe Trips</p>
          </Card>
          <Card className="bg-white p-4 rounded-xl text-center border-0 shadow-md">
            <p className="text-2xl font-bold text-[#C7B8FF] mb-1">12</p>
            <p className="text-xs text-gray-600">Buddies</p>
          </Card>
          <Card className="bg-white p-4 rounded-xl text-center border-0 shadow-md">
            <p className="text-2xl font-bold text-[#4A5FC1] mb-1">8</p>
            <p className="text-xs text-gray-600">Reports</p>
          </Card>
        </div>
      </div>

      {/* Emergency Button */}
      <EmergencyButton />
    </div>
  );
}
