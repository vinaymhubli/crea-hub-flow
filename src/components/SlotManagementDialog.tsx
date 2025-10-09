import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  X, 
  Clock, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Slot {
  id?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface SlotManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number;
  dayName: string;
  existingSlots: Slot[];
  onSaveSlots: (slots: Slot[]) => Promise<void>;
  onDeleteSlot: (slotId: string) => Promise<void>;
}

const daysOfWeek = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
  { label: "Sunday", value: 0 }
];

export function SlotManagementDialog({
  isOpen,
  onOpenChange,
  dayOfWeek,
  dayName,
  existingSlots,
  onSaveSlots,
  onDeleteSlot
}: SlotManagementDialogProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newSlot, setNewSlot] = useState({ start_time: "09:00", end_time: "10:00" });
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  // Initialize slots when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSlots([...existingSlots]);
      setErrors([]);
    }
  }, [isOpen, existingSlots]);

  const validateSlot = (slot: Slot, excludeId?: string): string[] => {
    const validationErrors: string[] = [];
    
    // Check if start time is before end time
    if (slot.start_time >= slot.end_time) {
      validationErrors.push("Start time must be before end time");
    }

    // Check for overlaps with existing slots
    const overlappingSlot = slots.find(s => 
      s.id !== excludeId && 
      s.is_active &&
      ((slot.start_time < s.end_time && slot.end_time > s.start_time))
    );

    if (overlappingSlot) {
      validationErrors.push(`Overlaps with existing slot: ${overlappingSlot.start_time} - ${overlappingSlot.end_time}`);
    }

    return validationErrors;
  };

  const addSlot = () => {
    const slotErrors = validateSlot(newSlot);
    
    if (slotErrors.length > 0) {
      setErrors(slotErrors);
      return;
    }

    if (slots.length >= 6) {
      setErrors(["Maximum 6 slots per day allowed"]);
      return;
    }

    const newSlotWithId = {
      ...newSlot,
      id: `temp_${Date.now()}`,
      is_active: true
    };

    setSlots([...slots, newSlotWithId]);
    setNewSlot({ start_time: "09:00", end_time: "10:00" });
    setErrors([]);
  };

  const updateSlot = (slotId: string, updatedSlot: Partial<Slot>) => {
    const slotErrors = validateSlot({ ...slots.find(s => s.id === slotId)!, ...updatedSlot }, slotId);
    
    if (slotErrors.length > 0) {
      setErrors(slotErrors);
      return;
    }

    setSlots(slots.map(slot => 
      slot.id === slotId ? { ...slot, ...updatedSlot } : slot
    ));
    setEditingSlot(null);
    setErrors([]);
  };

  const removeSlot = (slotId: string) => {
    setSlots(slots.filter(slot => slot.id !== slotId));
    setErrors([]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSaveSlots(slots);
      toast({
        title: "Success",
        description: `Slots for ${dayName} have been saved successfully`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving slots:', error);
      toast({
        title: "Error",
        description: "Failed to save slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSlotDuration = (start: string, end: string) => {
    const startTime = new Date(`1970-01-01T${start}`);
    const endTime = new Date(`1970-01-01T${end}`);
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Manage Time Slots - {dayName}
          </DialogTitle>
          <p className="text-gray-600">
            Add up to 6 time slots for {dayName}. Slots cannot overlap with each other.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Slots Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Slots ({slots.length}/6)</h3>
              <Badge variant={slots.length >= 6 ? "destructive" : "secondary"}>
                {slots.length >= 6 ? "Maximum reached" : `${6 - slots.length} slots remaining`}
              </Badge>
            </div>

            {slots.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No time slots configured for {dayName}</p>
                <p className="text-sm text-gray-400">Add your first slot below</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {slots.map((slot, index) => (
                  <Card key={slot.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getSlotDuration(slot.start_time, slot.end_time)}
                            </Badge>
                          </div>
                          {editingSlot === slot.id ? (
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateSlot(slot.id!, { start_time: e.target.value })}
                                className="w-32"
                              />
                              <span className="text-gray-400">to</span>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateSlot(slot.id!, { end_time: e.target.value })}
                                className="w-32"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSlot(null)}
                                className="rounded-xl border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 mt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSlot(slot.id!)}
                                className="rounded-xl hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-all duration-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSlot(slot.id!)}
                                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add New Slot */}
          {slots.length < 6 && (
            <Card className="p-4 border-dashed border-2 border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-600" />
                  Add New Slot
                </CardTitle>
                <CardDescription>
                  Create a new time slot for {dayName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={addSlot} 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl px-6 py-2.5 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || slots.length === 0}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-xl px-6 py-2.5 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : `Save ${slots.length} Slot${slots.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
