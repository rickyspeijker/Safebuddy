
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, MapPin, Clock, Star, Send, Heart, MessageCircle, Sparkles, TrendingUp, Shield, Settings, Bell, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmergencyButton from "../components/EmergencyButton";
import ChatModal from "../components/ChatModal";
import AvailabilityModal from "../components/AvailabilityModal";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BuddyMatch() {
  const [activeTab, setActiveTab] = useState("find");
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [matchedBuddies, setMatchedBuddies] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch buddy requests
  const { data: buddyRequests = [] } = useQuery({
    queryKey: ["buddyRequests"],
    queryFn: () => base44.entities.BuddyRequest.list("-created_date"),
    refetchInterval: 5000, // Check for new requests every 5 seconds
    enabled: !!currentUser, // Only run if currentUser is available
  });

  const acceptRequestMutation = useMutation({
    mutationFn: ({ id, requestData }) => base44.entities.BuddyRequest.update(id, requestData),
    onSuccess: () => {
      toast.success("Buddy request accepted!", {
        description: "You can now chat and coordinate your journey"
      });
      queryClient.invalidateQueries({ queryKey: ["buddyRequests"] });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: ({ id, requestData }) => base44.entities.BuddyRequest.update(id, requestData),
    onSuccess: () => {
      toast.info("Request declined");
      queryClient.invalidateQueries({ queryKey: ["buddyRequests"] });
    },
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // If user is available, find matches
      if (user?.buddy_availability?.is_available) {
        await findMatches(user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const findMatches = async (user) => {
    setLoading(true);
    try {
      const prompt = `You are a safety-focused buddy matching AI for SafeBuddy app. 
      
Current user profile:
- Available times: ${user.buddy_availability?.preferred_times?.join(", ") || "Not specified"}
- Preferred days: ${user.buddy_availability?.preferred_days?.join(", ") || "Not specified"}
- Common routes: ${user.buddy_availability?.common_routes?.join(", ") || "Not specified"}
- Safety preferences: ${user.safety_preferences?.avoid_dark_streets ? "Avoids dark streets" : ""}, ${user.safety_preferences?.prefer_busy_areas ? "Prefers busy areas" : ""}
- Activity: ${user.buddy_stats?.trips_this_month || 0} trips this month
- Rating: ${user.buddy_stats?.average_rating || 5.0}

Analyze these potential buddies and return a compatibility analysis for each:

Buddy 1: Emma Thompson
- Available: Early Morning, Evening
- Days: Monday, Tuesday, Wednesday, Friday
- Routes: Downtown → West End, City Center → North
- Stats: 24 trips, 4.9 rating, 95% response rate
- Preferences: Avoids dark streets, prefers busy areas

Buddy 2: Sofia Martinez  
- Available: Evening, Night
- Days: Monday, Wednesday, Thursday, Saturday
- Routes: City Center → Park Ave, Downtown → East Side
- Stats: 18 trips, 5.0 rating, 100% response rate
- Preferences: Avoids dark streets, prefers busy areas

Buddy 3: Olivia Chen
- Available: Morning, Afternoon, Evening
- Days: Tuesday, Thursday, Friday, Sunday
- Routes: Main St → North District, Central → West End
- Stats: 32 trips, 4.8 rating, 88% response rate
- Preferences: Flexible on routes

Buddy 4: Isabella Rodriguez
- Available: Evening, Night, Late Night
- Days: Every day
- Routes: Downtown → South, University → City Center
- Stats: 21 trips, 4.9 rating, 92% response rate
- Preferences: Prefers busy areas

Return a JSON array with compatibility scores (0-100) and reasons for each match.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  compatibility_score: { type: "number" },
                  match_reasons: {
                    type: "array",
                    items: { type: "string" }
                  },
                  shared_times: {
                    type: "array",
                    items: { type: "string" }
                  },
                  shared_routes: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      // Enrich with full buddy data
      const potentialBuddies = [
        {
          id: "user_1",
          name: "Emma Thompson",
          rating: 4.9,
          trips: 24,
          route: "Downtown → West End",
          time: "8:30 PM",
          distance: "0.2 km away",
          verified: true,
          responseRate: 95,
          availability: {
            times: ["Early Morning (6-9 AM)", "Evening (5-8 PM)"],
            days: ["Monday", "Tuesday", "Wednesday", "Friday"],
            routes: ["Downtown → West End", "City Center → North"]
          }
        },
        {
          id: "user_2",
          name: "Sofia Martinez",
          rating: 5.0,
          trips: 18,
          route: "City Center → Park Ave",
          time: "8:45 PM",
          distance: "0.5 km away",
          verified: true,
          responseRate: 100,
          availability: {
            times: ["Evening (5-8 PM)", "Night (8-11 PM)"],
            days: ["Monday", "Wednesday", "Thursday", "Saturday"],
            routes: ["City Center → Park Ave", "Downtown → East Side"]
          }
        },
        {
          id: "user_3",
          name: "Olivia Chen",
          rating: 4.8,
          trips: 32,
          route: "Main St → North District",
          time: "9:00 PM",
          distance: "0.8 km away",
          verified: true,
          responseRate: 88,
          availability: {
            times: ["Morning (9-12 PM)", "Afternoon (12-5 PM)", "Evening (5-8 PM)"],
            days: ["Tuesday", "Thursday", "Friday", "Sunday"],
            routes: ["Main St → North District", "Central → West End"]
          }
        },
        {
          id: "user_4",
          name: "Isabella Rodriguez",
          rating: 4.9,
          trips: 21,
          route: "Downtown → South",
          time: "10:00 PM",
          distance: "1.2 km away",
          verified: true,
          responseRate: 92,
          availability: {
            times: ["Evening (5-8 PM)", "Night (8-11 PM)", "Late Night (11 PM-6 AM)"],
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            routes: ["Downtown → South", "University → City Center"]
          }
        }
      ];

      // Merge AI scores with buddy data
      const enrichedMatches = response.matches.map(match => {
        const buddy = potentialBuddies.find(b => b.name === match.name);
        return {
          ...buddy,
          compatibility_score: match.compatibility_score,
          match_reasons: match.match_reasons,
          shared_times: match.shared_times,
          shared_routes: match.shared_routes
        };
      }).sort((a, b) => b.compatibility_score - a.compatibility_score);

      setMatchedBuddies(enrichedMatches);
    } catch (error) {
      console.error("Error finding matches:", error);
      // Fallback to unranked list
      setMatchedBuddies([
        {
          id: "user_1",
          name: "Emma Thompson",
          rating: 4.9,
          trips: 24,
          route: "Downtown → West End",
          time: "8:30 PM",
          distance: "0.2 km away",
          verified: true,
          responseRate: 95,
          compatibility_score: 85,
          match_reasons: ["Similar safety preferences", "Overlapping schedule"],
          availability: {
            times: ["Early Morning (6-9 AM)", "Evening (5-8 PM)"],
            days: ["Monday", "Tuesday", "Wednesday", "Friday"],
            routes: ["Downtown → West End", "City Center → North"]
          }
        }
      ]);
    }
    setLoading(false);
  };

  const openChat = (buddy) => {
    setSelectedBuddy(buddy);
    setShowChat(true);
  };

  const handleAvailabilityUpdate = () => {
    loadUser();
    toast.success("Finding compatible buddies...");
  };

  const handleAcceptRequest = async (request) => {
    await acceptRequestMutation.mutateAsync({
      id: request.id,
      requestData: {
        status: "matched",
      }
    });
  };

  const handleDeclineRequest = async (request) => {
    await declineRequestMutation.mutateAsync({
      id: request.id,
      requestData: {
        status: "cancelled",
      }
    });
  };

  // Filter requests for current user
  const myPendingRequests = buddyRequests.filter(
    r => r.matched_user_id === currentUser?.id && r.status === "pending"
  );

  const myAcceptedRequests = buddyRequests.filter(
    r => (r.matched_user_id === currentUser?.id || r.created_by === currentUser?.email) && r.status === "matched"
  );


  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#4A5FC1] to-[#C7B8FF] pt-12 pb-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-2xl font-bold">Buddy Match</h1>
            <div className="flex items-center gap-2">
              {myPendingRequests.length > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {myPendingRequests.length}
                  </div>
                </div>
              )}
              <Button
                onClick={() => setShowAvailability(true)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-white/80 text-sm mb-3">AI-powered safety matching</p>
          
          {/* Availability Status */}
          <div className={`p-3 rounded-2xl ${
            currentUser?.buddy_availability?.is_available
              ? "bg-green-500/20 border border-green-400/30"
              : "bg-white/20 border border-white/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentUser?.buddy_availability?.is_available ? "bg-green-400" : "bg-white/60"
                }`} />
                <span className="text-white text-sm font-medium">
                  {currentUser?.buddy_availability?.is_available ? "Available" : "Not Available"}
                </span>
              </div>
              <Button
                onClick={() => setShowAvailability(true)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full text-xs h-7 px-3"
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab("find")}
            variant={activeTab === "find" ? "default" : "outline"}
            className={`flex-1 rounded-2xl h-12 font-semibold ${
              activeTab === "find"
                ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                : "bg-white text-gray-700 border-2 border-gray-200"
            }`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Matches
          </Button>
          <Button
            onClick={() => setActiveTab("requests")}
            variant={activeTab === "requests" ? "default" : "outline"}
            className={`flex-1 rounded-2xl h-12 font-semibold relative ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                : "bg-white text-gray-700 border-2 border-gray-200"
            }`}
          >
            <Bell className="w-4 h-4 mr-2" />
            Requests
            {myPendingRequests.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-0 rounded-full w-6 h-6 flex items-center justify-center p-0 text-xs">
                {myPendingRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab("chats")}
            variant={activeTab === "chats" ? "default" : "outline"}
            className={`flex-1 rounded-2xl h-12 font-semibold ${
              activeTab === "chats"
                ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                : "bg-white text-gray-700 border-2 border-gray-200"
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chats
          </Button>
        </div>

        {activeTab === "find" && (
          <>
            {!currentUser?.buddy_availability?.is_available ? (
              <Card className="bg-gradient-to-br from-[#F5F2FF] to-white p-6 rounded-3xl border border-[#E5DFFF] text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Set Your Availability
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Let AI find compatible buddies based on your schedule, routes, and safety preferences
                </p>
                <Button
                  onClick={() => setShowAvailability(true)}
                  className="rounded-2xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Availability
                </Button>
              </Card>
            ) : (
              <>
                {/* Info Card */}
                <Card className="bg-gradient-to-br from-[#FFF5E1] to-[#FFE4B5] p-4 rounded-2xl border-0 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        AI-Powered Matching
                      </p>
                      <p className="text-xs text-gray-700">
                        Buddies ranked by compatibility based on schedules, routes, and safety preferences
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-[#C7B8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Finding your best matches...</p>
                  </div>
                )}

                {/* Buddy List */}
                {!loading && (
                  <div className="space-y-4">
                    {matchedBuddies.map((buddy, index) => (
                      <Card
                        key={index}
                        className="bg-white p-5 rounded-3xl shadow-lg border-0 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Compatibility Score */}
                        {buddy.compatibility_score && (
                          <div className="flex items-center justify-between mb-4">
                            <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white border-0 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {buddy.compatibility_score}% Match
                            </Badge>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white border-0 px-3 py-1 rounded-full">
                                🏆 Best Match
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-start gap-4 mb-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {buddy.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            {buddy.verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{buddy.name}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">{buddy.rating}</span>
                              </div>
                              <span>•</span>
                              <span>{buddy.trips} trips</span>
                              <span>•</span>
                              <span className="text-green-600 font-medium">{buddy.responseRate}% response</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Reasons */}
                        {buddy.match_reasons && buddy.match_reasons.length > 0 && (
                          <div className="bg-gradient-to-br from-[#F5F2FF] to-white p-3 rounded-xl mb-4 border border-[#E5DFFF]">
                            <p className="text-xs font-semibold text-[#2C3E91] mb-2 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              Why this match?
                            </p>
                            <ul className="space-y-1">
                              {buddy.match_reasons.slice(0, 3).map((reason, idx) => (
                                <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="text-[#C7B8FF] mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2 mb-4">
                          {buddy.shared_routes && buddy.shared_routes.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-[#4A5FC1]" />
                              <span className="text-gray-700">
                                {buddy.shared_routes[0] || buddy.route}
                              </span>
                            </div>
                          )}
                          {buddy.shared_times && buddy.shared_times.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-[#C7B8FF]" />
                              <span className="text-gray-700">
                                Available: {buddy.shared_times.slice(0, 2).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                          <Badge className="bg-[#E5DFFF] text-[#2C3E91] border-0 px-3 py-1 rounded-full flex-1 text-center">
                            {buddy.distance}
                          </Badge>
                          <Button 
                            onClick={() => openChat(buddy)}
                            className="h-10 px-6 rounded-full bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold shadow-md"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {matchedBuddies.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-10 h-10 text-[#C7B8FF]" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Finding Matches</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Update your availability to see AI-matched buddies
                        </p>
                        <Button
                          onClick={() => setShowAvailability(true)}
                          className="rounded-2xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white"
                        >
                          Update Availability
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {myPendingRequests.length > 0 && (
              <>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#4A5FC1]" />
                  Pending Requests ({myPendingRequests.length})
                </h3>
                {myPendingRequests.map((request) => (
                  <Card key={request.id} className="bg-white p-5 rounded-3xl shadow-lg border-0">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Someone wants to be your buddy!
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {request.from_location?.address} → {request.to_location?.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{request.departure_time ? format(new Date(request.departure_time), "MMM d, h:mm a") : 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDeclineRequest(request)}
                        disabled={declineRequestMutation.isPending}
                        variant="outline"
                        className="flex-1 rounded-xl border-2 border-gray-200"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleAcceptRequest(request)}
                        disabled={acceptRequestMutation.isPending}
                        className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}

            {myAcceptedRequests.length > 0 && (
              <>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mt-6">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Confirmed Buddies ({myAcceptedRequests.length})
                </h3>
                {myAcceptedRequests.map((request) => (
                  <Card key={request.id} className="bg-gradient-to-br from-green-50 to-white p-5 rounded-3xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-500 text-white border-0 px-3 py-1 rounded-full text-xs">
                        Matched
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{request.from_location?.address} → {request.to_location?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{request.departure_time ? format(new Date(request.departure_time), "MMM d, h:mm a") : 'Not specified'}</span>
                    </div>
                    <Button
                      onClick={() => {
                        // This is a placeholder. In a real app, 'request.buddy_info' would provide buddy details
                        // For now, we take a mock buddy or the first available matched buddy.
                        const buddy = matchedBuddies.find(b => b.id === request.buddy_id) || {
                          id: request.buddy_id || "default_buddy_id", // Fallback ID
                          name: request.matched_user_name || "Your Buddy", // Assuming matched_user_name exists or fallback
                          rating: 4.9, // Mock data
                          trips: 20, // Mock data
                          route: request.to_location?.address || "Unknown route", // Use request info
                          time: request.departure_time ? format(new Date(request.departure_time), "h:mm a") : "Unknown time", // Use request info
                          distance: "0 km away", // Mock data
                          verified: true,
                          responseRate: 98,
                          compatibility_score: 90,
                          match_reasons: ["Accepted request"],
                          availability: {
                            times: [],
                            days: [],
                            routes: []
                          }
                        };
                        openChat(buddy);
                      }}
                      className="w-full rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat with Buddy
                    </Button>
                  </Card>
                ))}
              </>
            )}

            {myPendingRequests.length === 0 && myAcceptedRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-[#C7B8FF]" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">No Buddy Requests</h3>
                <p className="text-sm text-gray-600">
                  When someone requests to be your buddy, you'll see it here
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "chats" && (
          <div>
            {/* Active Chats */}
            <div className="space-y-3">
              {matchedBuddies.slice(0, 2).map((buddy, index) => (
                <Card
                  key={index}
                  onClick={() => openChat(buddy)}
                  className="bg-white p-4 rounded-2xl shadow-md border-0 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center text-white font-bold">
                        {buddy.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                          {buddy.name}
                          {buddy.compatibility_score >= 80 && (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs px-2 py-0">
                              {buddy.compatibility_score}%
                            </Badge>
                          )}
                        </h3>
                        <span className="text-xs text-gray-500">2m ago</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        Sounds good! See you at {buddy.time}
                      </p>
                    </div>
                    <Badge className="bg-[#C7B8FF] text-white border-0 rounded-full w-6 h-6 flex items-center justify-center p-0">
                      2
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            {matchedBuddies.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-[#C7B8FF]" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Start chatting with AI-matched buddies to plan safe trips together
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showChat && selectedBuddy && (
        <ChatModal
          buddy={selectedBuddy}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedBuddy(null);
          }}
        />
      )}

      <AvailabilityModal
        open={showAvailability}
        onClose={() => setShowAvailability(false)}
        currentUser={currentUser}
        onUpdate={handleAvailabilityUpdate}
      />

      <EmergencyButton />
    </div>
  );
}
