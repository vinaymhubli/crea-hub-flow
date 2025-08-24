import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReschedule: (newDateTime: string) => void;
  currentDate: string;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  onReschedule,
  currentDate,
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const handleReschedule = () => {
    if (selectedDate && selectedTime) {
      const newDateTime = `${selectedDate}T${selectedTime}:00`;
      onReschedule(newDateTime);
      onOpenChange(false);
      setSelectedDate("");
      setSelectedTime("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">New Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">New Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime}
              className="flex-1"
            >
              Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}