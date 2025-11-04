import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ChatModal({ buddy, currentUser, onClose }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const conversationId = [currentUser?.id, buddy.id].sort().join("_");

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => base44.entities.Message.filter(
      { conversation_id: conversationId },
      "created_date"
    ),
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      setMessage("");
    },
  });

  const handleSend = async () => {
    if (!message.trim() || !currentUser) return;

    await sendMessageMutation.mutateAsync({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || "You",
      receiver_id: buddy.id,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-0 overflow-hidden h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border-2 border-white/50">
                {buddy.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  {buddy.name}
                  {buddy.verified && <span className="text-sm">✓</span>}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <Star className="w-3 h-3 fill-white" />
                  <span>{buddy.rating}</span>
                  <span>•</span>
                  <span>{buddy.trips} trips</span>
                </div>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Route Info */}
          {buddy.route && (
            <div className="mt-3 p-3 bg-white/20 backdrop-blur-md rounded-xl">
              <div className="flex items-center gap-2 text-sm text-white">
                <MapPin className="w-4 h-4" />
                <span>{buddy.route}</span>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-8 h-8 text-[#C7B8FF]" />
              </div>
              <p className="text-sm text-gray-600">
                Start the conversation with {buddy.name.split(" ")[0]}!
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Plan your safe journey together
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isCurrentUser
                      ? "bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? "text-white/70" : "text-gray-500"
                    }`}
                  >
                    {format(new Date(msg.created_date), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-2xl border-2 border-gray-200 focus:border-[#C7B8FF] h-12"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="h-12 w-12 rounded-2xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}