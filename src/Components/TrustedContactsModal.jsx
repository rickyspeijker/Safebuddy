import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";

export default function TrustedContactsModal({ open, onClose, contacts, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [localContacts, setLocalContacts] = useState(contacts || []);

  const addContact = () => {
    setLocalContacts([...localContacts, { name: "", phone: "", relationship: "" }]);
    setEditMode(true);
  };

  const removeContact = (index) => {
    setLocalContacts(localContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index, field, value) => {
    const updated = [...localContacts];
    updated[index][field] = value;
    setLocalContacts(updated);
  };

  const handleSave = async () => {
    try {
      await base44.auth.updateMe({
        trusted_contacts: localContacts.filter(c => c.name && c.phone),
      });
      toast.success("Trusted contacts updated successfully");
      setEditMode(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating contacts:", error);
      toast.error("Failed to update contacts");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-[#4A5FC1] to-[#2C3E91] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <Phone className="w-7 h-7" />
              Trusted Contacts
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            These contacts will be notified immediately if you activate an emergency alert.
          </p>

          <div className="space-y-4 mb-6">
            {localContacts.map((contact, index) => (
              <div key={index} className="p-4 bg-[#F5F2FF] rounded-2xl">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`name-${index}`} className="text-xs">Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={contact.name}
                        onChange={(e) => updateContact(index, "name", e.target.value)}
                        placeholder="Full name"
                        className="mt-1 rounded-xl border-2 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`phone-${index}`} className="text-xs">Phone</Label>
                      <Input
                        id={`phone-${index}`}
                        value={contact.phone}
                        onChange={(e) => updateContact(index, "phone", e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1 rounded-xl border-2 border-gray-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`relationship-${index}`} className="text-xs">Relationship</Label>
                      <Input
                        id={`relationship-${index}`}
                        value={contact.relationship}
                        onChange={(e) => updateContact(index, "relationship", e.target.value)}
                        placeholder="e.g., Sister, Friend"
                        className="mt-1 rounded-xl border-2 border-gray-200"
                      />
                    </div>
                    <Button
                      onClick={() => removeContact(index)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C7B8FF] to-[#A99EE8] rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      <p className="text-xs text-gray-500">{contact.relationship}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {localContacts.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#F5F2FF] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-8 h-8 text-[#C7B8FF]" />
                </div>
                <p className="text-sm text-gray-600">No trusted contacts added yet</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {editMode ? (
              <>
                <Button
                  onClick={() => {
                    setLocalContacts(contacts);
                    setEditMode(false);
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl border-2 border-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={addContact}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#C7B8FF] to-[#A99EE8] hover:from-[#B8A9FF] hover:to-[#9989D8] text-white font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
                {localContacts.length > 0 && (
                  <Button
                    onClick={() => setEditMode(true)}
                    variant="outline"
                    className="rounded-xl border-2 border-gray-200"
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}