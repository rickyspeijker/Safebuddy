import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, MapPin, ThumbsUp, AlertTriangle, Lightbulb, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmergencyButton from "../components/EmergencyButton";
import ReportModal from "../components/ReportModal";

export default function Community() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: reports = [], refetch } = useQuery({
    queryKey: ["safetyReports"],
    queryFn: () => base44.entities.SafetyReport.list("-created_date"),
  });

  const getReportIcon = (type) => {
    if (type === "safe_spot" || type === "well_lit") return Lightbulb;
    return AlertTriangle;
  };

  const getReportColor = (type) => {
    if (type === "safe_spot" || type === "well_lit") return "from-green-400 to-green-500";
    if (type === "poor_lighting") return "from-yellow-400 to-yellow-500";
    return "from-red-400 to-red-500";
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    };
    return colors[severity] || colors.medium;
  };

  const filteredReports = filter === "all" 
    ? reports 
    : reports.filter(r => r.report_type === filter);

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#C7B8FF] via-[#A99EE8] to-[#8B7ED8] pt-12 pb-8 px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-white text-2xl font-bold mb-2">Community Safety</h1>
          <p className="text-white/80 text-sm">Share and learn from others' experiences</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4">
        {/* Add Report Button */}
        <Button
          onClick={() => setShowReportModal(true)}
          className="w-full h-14 rounded-2xl bg-white hover:bg-gray-50 text-gray-900 font-bold shadow-xl border-0 mb-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Report a Location
        </Button>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {[
            { value: "all", label: "All Reports" },
            { value: "unsafe_area", label: "Unsafe" },
            { value: "poor_lighting", label: "Dark" },
            { value: "safe_spot", label: "Safe" },
          ].map((f) => (
            <Button
              key={f.value}
              onClick={() => setFilter(f.value)}
              variant={filter === f.value ? "default" : "outline"}
              className={`rounded-full px-5 h-9 text-sm font-semibold whitespace-nowrap ${
                filter === f.value
                  ? "bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] text-white border-0"
                  : "bg-white text-gray-700 border-2 border-gray-200"
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const Icon = getReportIcon(report.report_type);
            const colorGradient = getReportColor(report.report_type);

            return (
              <Card
                key={report.id}
                className="bg-white p-5 rounded-3xl shadow-lg border-0"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1">
                          {report.report_type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{report.location.address}</span>
                        </div>
                      </div>
                      <Badge className={`${getSeverityBadge(report.severity)} border-0 px-2 py-1 rounded-full text-xs`}>
                        {report.severity}
                      </Badge>
                    </div>

                    {report.description && (
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {report.time_of_day || "Evening"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-full hover:bg-[#F5F2FF]"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 mr-1.5 text-[#4A5FC1]" />
                        <span className="text-sm font-semibold text-[#4A5FC1]">
                          {report.upvotes || 0}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-[#C7B8FF]" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">No reports yet</h3>
              <p className="text-sm text-gray-600">
                Be the first to share safety information in your area
              </p>
            </div>
          )}
        </div>
      </div>

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          setShowReportModal(false);
          refetch();
        }}
      />

      <EmergencyButton />
    </div>
  );
}