
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { User, Shield, Heart, Phone, Bell, LogOut, ChevronRight, Edit, Camera, Save, X, Star, TrendingUp, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import EmergencyButton from "../components/EmergencyButton";
import TrustedContactsModal from "../components/TrustedContactsModal";
import AvailabilityModal from "../components/AvailabilityModal";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    full_name: "",
    bio: "",
    profile_image: "",
  });
  const [preferences, setPreferences] = useState({
    avoid_dark_streets: true,
    prefer_busy_areas: true,
    notification_enabled: true,
  });

  // Fetch user ratings
  const { data: myRatings = [] } = useQuery({
    queryKey: ["myRatings", user?.id],
    queryFn: () => base44.entities.Rating.filter({ rated_user_id: user.id }),
    enabled: !!user?.id,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setEditedProfile({
        full_name: currentUser.full_name || "",
        bio: currentUser.bio || "",
        profile_image: currentUser.profile_image || "",
      });
      if (currentUser.safety_preferences) {
        setPreferences(currentUser.safety_preferences);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedProfile({ ...editedProfile, profile_image: file_url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    try {
      await base44.auth.updateMe({
        full_name: editedProfile.full_name,
        bio: editedProfile.bio,
        profile_image: editedProfile.profile_image,
      });
      toast.success("Profile updated successfully");
      setEditMode(false);
      loadUser();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      full_name: user?.full_name || "",
      bio: user?.bio || "",
      profile_image: user?.profile_image || "",
    });
    setEditMode(false);
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await base44.auth.updateMe({
        safety_preferences: newPreferences,
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Calculate average rating from actual ratings
  const averageRating = myRatings.length > 0
    ? (myRatings.reduce((sum, r) => sum + r.rating, 0) / myRatings.length).toFixed(1)
    : user?.buddy_stats?.average_rating?.toFixed(1) || "5.0";

  const menuItems = [
    {
      icon: Phone,
      title: "Trusted Contacts",
      description: `${user?.trusted_contacts?.length || 0} contacts`,
      onClick: () => setShowContactsModal(true),
    },
    {
      icon: Bell,
      title: "Buddy Availability",
      description: user?.buddy_availability?.is_available ? "Available" : "Not available",
      onClick: () => setShowAvailabilityModal(true),
    },
    {
      icon: Shield,
      title: "Safety Settings",
      description: "Manage your preferences",
    },
    {
      icon: Heart,
      title: "About SafeBuddy",
      description: "Learn more about us",
    },
  ];

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2C3E91] via-[#4A5FC1] to-[#C7B8FF] pt-12 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-[#C7B8FF]/20 rounded-full blur-3xl" />
        
        <div className="max-w-md mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white text-2xl font-bold">My Profile</h1>
            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {editedProfile.profile_image ? (
                <img
                  src={editedProfile.profile_image}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              {editMode && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {editMode ? (
              <div className="w-full space-y-3 mb-4">
                <Input
                  value={editedProfile.full_name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                  placeholder="Full name"
                  className="text-center bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-2xl h-12"
                />
                <Textarea
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  placeholder="Write a short bio..."
                  rows={2}
                  className="text-center bg-white/20 border-white/30 text-white placeholder:text-white/60 rounded-2xl resize-none"
                />
              </div>
            ) : (
              <>
                <h2 className="text-white text-xl font-bold mb-1">
                  {user?.full_name || "User"}
                </h2>
                <p className="text-white/80 text-sm mb-2">{user?.email}</p>
                {user?.bio && (
                  <p className="text-white/90 text-sm text-center mb-3 max-w-xs">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold">{averageRating}</span>
                  </div>
                  {user?.verified && (
                    <Badge className="bg-white/20 text-white border-0 px-3 py-1 rounded-full backdrop-blur-md">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </>
            )}

            {editMode && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1 rounded-2xl border-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 rounded-2xl bg-white text-[#2C3E91] hover:bg-white/90 font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-10 relative z-10">
        {/* Stats Cards - Using Real Buddy Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white p-4 rounded-2xl text-center border-0 shadow-lg">
            <TrendingUp className="w-5 h-5 text-[#2C3E91] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#2C3E91] mb-1">
              {user?.buddy_stats?.trips_this_month || 0}
            </p>
            <p className="text-xs text-gray-600">This Month</p>
          </Card>
          <Card className="bg-white p-4 rounded-2xl text-center border-0 shadow-lg">
            <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1 fill-yellow-400" />
            <p className="text-2xl font-bold text-[#C7B8FF] mb-1">{averageRating}</p>
            <p className="text-xs text-gray-600">Rating</p>
          </Card>
          <Card className="bg-white p-4 rounded-2xl text-center border-0 shadow-lg">
            <MessageCircle className="w-5 h-5 text-[#4A5FC1] mx-auto mb-1" />
            <p className="text-2xl font-bold text-[#4A5FC1] mb-1">
              {user?.buddy_stats?.response_rate || 100}%
            </p>
            <p className="text-xs text-gray-600">Response</p>
          </Card>
        </div>

        {/* Total Stats */}
        <Card className="bg-gradient-to-br from-[#F5F2FF] to-white p-5 rounded-3xl border border-[#E5DFFF] mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Lifetime Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-[#2C3E91]">
                {user?.buddy_stats?.total_trips || 0}
              </p>
              <p className="text-sm text-gray-600">Total Trips</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#4A5FC1]">
                {myRatings.length}
              </p>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
          </div>
        </Card>

        {/* Recent Reviews */}
        {myRatings.length > 0 && (
          <Card className="bg-white p-5 rounded-3xl shadow-lg border-0 mb-4">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              Recent Reviews ({myRatings.length})
            </h3>
            <div className="space-y-3">
              {myRatings.slice(0, 3).map((rating, idx) => (
                <div key={idx} className="p-3 bg-[#F5F2FF] rounded-xl">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rating.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(rating.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review && (
                    <p className="text-xs text-gray-700">{rating.review}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Safety Preferences */}
        <Card className="bg-white p-5 rounded-3xl shadow-lg border-0 mb-4">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4A5FC1]" />
            Safety Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Avoid dark streets</p>
                <p className="text-xs text-gray-600">Prioritize well-lit routes</p>
              </div>
              <Switch
                checked={preferences.avoid_dark_streets}
                onCheckedChange={(checked) => handlePreferenceChange("avoid_dark_streets", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Prefer busy areas</p>
                <p className="text-xs text-gray-600">Route through populated streets</p>
              </div>
              <Switch
                checked={preferences.prefer_busy_areas}
                onCheckedChange={(checked) => handlePreferenceChange("prefer_busy_areas", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Notifications</p>
                <p className="text-xs text-gray-600">Safety alerts and updates</p>
              </div>
              <Switch
                checked={preferences.notification_enabled}
                onCheckedChange={(checked) => handlePreferenceChange("notification_enabled", checked)}
              />
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="bg-white rounded-3xl shadow-lg border-0 overflow-hidden mb-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={item.onClick}
                className={`flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="w-11 h-11 bg-[#F5F2FF] rounded-2xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#4A5FC1]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            );
          })}
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-semibold"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <TrustedContactsModal
        open={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        contacts={user?.trusted_contacts || []}
        onUpdate={loadUser}
      />

      <AvailabilityModal
        open={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        currentUser={user}
        onUpdate={loadUser}
      />

      <EmergencyButton />
    </div>
  );
}
