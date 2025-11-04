import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

export default function ReportModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    report_type: "",
    severity: "medium",
    description: "",
    time_of_day: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, we'd geocode the address
      // For now, using mock coordinates
      const location = {
        lat: 40.7128 + Math.random() * 0.1,
        lng: -74.0060 + Math.random() * 0.1,
        address: formData.address,
      };

      await base44.entities.SafetyReport.create({
        location,
        report_type: formData.report_type,
        severity: formData.severity,
        description: formData.description,
        time_of_day: formData.time_of_day,
        upvotes: 0,
        status: "active",
      });

      toast.success("Thank you for helping keep our community safe!", {
        description: "Your report has been shared with other users.",
      });

      setFormData({
        address: "",
        report_type: "",
        severity: "medium",
        description: "",
        time_of_day: "",
      });

      onSuccess();
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("Failed to submit report. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <MapPin className="w-7 h-7" />
              Report Location
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Location Address</Label>
            <Input
              id="address"
              placeholder="Enter street address or landmark"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              className="rounded-xl border-2 border-gray-200 focus:border-[#C7B8FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report_type">Report Type</Label>
            <Select
              value={formData.report_type}
              onValueChange={(value) => setFormData({ ...formData, report_type: value })}
              required
            >
              <SelectTrigger className="rounded-xl border-2 border-gray-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unsafe_area">Unsafe Area</SelectItem>
                <SelectItem value="poor_lighting">Poor Lighting</SelectItem>
                <SelectItem value="isolated">Isolated/Empty</SelectItem>
                <SelectItem value="harassment">Harassment Incident</SelectItem>
                <SelectItem value="safe_spot">Safe Spot</SelectItem>
                <SelectItem value="well_lit">Well Lit Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger className="rounded-xl border-2 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time of Day</Label>
            <Input
              id="time"
              placeholder="e.g., Evening, Late night"
              value={formData.time_of_day}
              onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
              className="rounded-xl border-2 border-gray-200 focus:border-[#C7B8FF]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Share details to help others stay safe..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="rounded-xl border-2 border-gray-200 focus:border-[#C7B8FF]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}