import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, MapPin, X } from "lucide-react";
import { toast } from "sonner";

const TIME_SLOTS = [
  "Early Morning (6-9 AM)",
  "Morning (9-12 PM)",
  "Afternoon (12-5 PM)",
  "Evening (5-8 PM)",
  "Night (8-11 PM)",
  "Late Night (11 PM-6 AM)",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityModal({ open, onClose, currentUser, onUpdate }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [commonRoutes, setCommonRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.buddy_availability) {
      const avail = currentUser.buddy_availability;
      setIsAvailable(avail.is_available || false);
      setSelectedTimes(avail.preferred_times || []);
      setSelectedDays(avail.preferred_days || []);
      setCommonRoutes(avail.common_routes || []);
    }
  }, [currentUser]);

  const toggleTime = (time) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const addRoute = () => {
    if (newRoute.trim() && !commonRoutes.includes(newRoute.trim())) {
      setCommonRoutes([...commonRoutes, newRoute.trim()]);
      setNewRoute("");
    }
  };

  const removeRoute = (route) => {
    setCommonRoutes(commonRoutes.filter(r => r !== route));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        buddy_availability: {
          is_available: isAvailable,
          preferred_times: selectedTimes,
          preferred_days: selectedDays,
          common_routes: commonRoutes,
        },
      });
      toast.success("Availability settings saved!");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-3xl border-0 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="w-7 h-7" />
              Buddy Availability
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#F5F2FF] to-white rounded-2xl border border-[#E5DFFF]">
            <div>
              <p className="font-semibold text-gray-900">Available for Buddy Matching</p>
              <p className="text-xs text-gray-600 mt-1">
                Let others find you as a potential buddy
              </p>
            </div>
            <Switch
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
              className="data-[state=checked]:bg-[#C7B8FF]"
            />
          </div>

          {/* Preferred Times */}
          <div>
            <Label className="flex items-center gap-2 mb-3 font-semibold text-gray-900">
              <Clock className="w-4 h-4 text-[#4A5FC1]" />
              Preferred Travel Times
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((time) => (
                <Button
                  key={time}
                  onClick={() => toggleTime(time)}
                  variant="outline"
                  className={`h-auto py-2.5 px-3 text-xs rounded-xl transition-all ${
                    selectedTimes.includes(time)
                      ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                      : "border-2 border-gray-200 text-gray-700 hover:border-[#C7B8FF]"
                  }`}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Preferred Days */}
          <div>
            <Label className="flex items-center gap-2 mb-3 font-semibold text-gray-900">
              <Calendar className="w-4 h-4 text-[#4A5FC1]" />
              Preferred Days
            </Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <Button
                  key={day}
                  onClick={() => toggleDay(day)}
                  variant="outline"
                  size="sm"
                  className={`rounded-full text-xs transition-all ${
                    selectedDays.includes(day)
                      ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                      : "border-2 border-gray-200 text-gray-700 hover:border-[#C7B8FF]"
                  }`}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Common Routes */}
          <div>
            <Label className="flex items-center gap-2 mb-3 font-semibold text-gray-900">
              <MapPin className="w-4 h-4 text-[#4A5FC1]" />
              Common Routes
            </Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addRoute()}
                placeholder="e.g., Downtown to West End"
                className="flex-1 rounded-xl border-2 border-gray-200 focus:border-[#C7B8FF]"
              />
              <Button
                onClick={addRoute}
                className="rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8]"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {commonRoutes.map((route, index) => (
                <Badge
                  key={index}
                  className="bg-[#F5F2FF] text-[#2C3E91] border border-[#E5DFFF] px-3 py-1.5 rounded-full text-xs flex items-center gap-2"
                >
                  {route}
                  <button
                    onClick={() => removeRoute(route)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {commonRoutes.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">
                Add routes you frequently travel
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-br from-[#FFF5E1] to-[#FFE4B5] p-4 rounded-2xl">
            <p className="text-sm text-gray-700">
              <strong>💡 Tip:</strong> The more details you provide, the better we can match you with compatible buddies!
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl border-2 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}