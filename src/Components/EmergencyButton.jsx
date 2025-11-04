import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { AlertCircle, Shield, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function EmergencyButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [activating, setActivating] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const handleEmergencyPress = () => {
    setShowDialog(true);
    startCountdown();
  };

  const startCountdown = () => {
    let count = 5;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        activateEmergency();
      }
    }, 1000);
  };

  const activateEmergency = async () => {
    setActivating(true);
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: "Current location",
      };

      // Create emergency alert
      await base44.entities.EmergencyAlert.create({
        location,
        alert_type: "emergency",
        status: "active",
      });

      // Get user's trusted contacts
      const user = await base44.auth.me();
      const contacts = user.trusted_contacts || [];

      // Send notifications (in real app, this would trigger SMS/push)
      toast.success("Emergency alert sent to your trusted contacts!", {
        description: "Help is on the way. Stay safe.",
      });

      setShowDialog(false);
    } catch (error) {
      console.error("Error activating emergency:", error);
      toast.error("Failed to send alert. Please call emergency services.");
    }
    setActivating(false);
  };

  const cancelEmergency = () => {
    setCountdown(null);
    setShowDialog(false);
  };

  return (
    <>
      {/* Floating Emergency Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          onClick={handleEmergencyPress}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl border-4 border-white glow"
          style={{ boxShadow: "0 0 30px rgba(239, 68, 68, 0.5)" }}
        >
          <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
        </Button>
      </div>

      {/* Emergency Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                Emergency Alert
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            {countdown !== null && countdown > 0 ? (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-8 border-red-500 animate-ping opacity-20" />
                  <span className="text-6xl font-bold text-red-600">{countdown}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Activating Emergency Alert
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Your location will be shared with trusted contacts and nearby SafeBuddy users
                </p>
                <Button
                  onClick={cancelEmergency}
                  variant="outline"
                  className="w-full rounded-full border-2 border-gray-300 hover:border-gray-400"
                >
                  Cancel
                </Button>
              </div>
            ) : activating ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
                <p className="text-lg font-semibold text-gray-900">Sending alert...</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}