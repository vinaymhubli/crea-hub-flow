import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  RefreshCw,
  Plus,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function AddTimeSlotDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Time Slot</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Add New Time Slot</DialogTitle>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p className="text-gray-600 text-sm">Create a recurring weekly time slot for bookings</p>
          
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((day) => (
                  <SelectItem key={day} value={day.toLowerCase()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white"
            >
              Add Slot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSpecialDayDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Special Day</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Special Day</DialogTitle>
          <p className="text-gray-600 text-sm">Set availability for a specific date that differs from your regular schedule</p>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Available</Label>
              <p className="text-sm text-gray-500">Toggle if you're available on this date</p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>

          {isAvailable && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input type="time" defaultValue="17:00" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input 
              id="reason" 
              placeholder="e.g., Holiday, Personal time, etc."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              className="bg-gradient-to-r from-purple-400 to-pink-500 text-white"
            >
              Add Special Day
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DesignerAvailability() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "17:00"
  });
  const [bufferTime, setBufferTime] = useState("15");
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(false);

  const weekDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "10:00", end: "16:00" },
    sunday: { enabled: false, start: "10:00", end: "16:00" }
  });

  const specialDays = [
    {
      date: "Aug 20, 2025",
      type: "unavailable",
      reason: "Personal Day",
      color: "bg-red-100 text-red-800"
    },
    {
      date: "Aug 25, 2025", 
      type: "custom",
      hours: "10:00 AM - 2:00 PM",
      reason: "Limited availability",
      color: "bg-yellow-100 text-yellow-800"
    }
  ];

  const toggleDayAvailability = (day: string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], enabled: !prev[day as keyof typeof prev].enabled }
    }));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Enhanced Header */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Availability Management</h1>
                    <p className="text-white/90 text-lg">Manage your weekly schedule and special day exceptions</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-white/90 font-medium">40 hours/week</span>
                      <span className="text-white/60">•</span>
                      <span className="text-white/90 font-medium">5 days active</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Calendar
                </Button>
                <AddTimeSlotDialog />
              </div>
            </div>
          </header>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Quick Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Quick Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-semibold text-gray-700">Auto-accept bookings</Label>
                      <p className="text-sm text-gray-500">Automatically confirm new bookings</p>
                    </div>
                    <Switch checked={autoAcceptBookings} onCheckedChange={setAutoAcceptBookings} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-gray-700">Buffer time between sessions</Label>
                    <Select value={bufferTime} onValueChange={setBufferTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Working Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-700">Start Time</Label>
                      <Input 
                        type="time" 
                        value={workingHours.start}
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-700">End Time</Label>
                      <Input 
                        type="time" 
                        value={workingHours.end}
                        onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                    Apply to All Days
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total hours:</span>
                      <span className="font-semibold text-gray-900">40 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Booked:</span>
                      <span className="font-semibold text-green-600">8 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available:</span>
                      <span className="font-semibold text-blue-600">32 hours</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 mb-8">
                <TabsList className="grid w-auto grid-cols-2 bg-transparent gap-2">
                  <TabsTrigger 
                    value="weekly"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-8 font-semibold flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Weekly Schedule</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="special"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl py-3 px-8 font-semibold flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Special Days</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="weekly" className="space-y-6">
                <div className="grid gap-4">
                  {weekDays.map((day) => {
                    const dayKey = day.toLowerCase() as keyof typeof weeklySchedule;
                    const dayData = weeklySchedule[dayKey];
                    
                    return (
                      <Card key={day} className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-3">
                                <Switch 
                                  checked={dayData.enabled}
                                  onCheckedChange={() => toggleDayAvailability(dayKey)}
                                />
                                <div>
                                  <h3 className="font-bold text-gray-900">{day}</h3>
                                  <p className="text-sm text-gray-500">
                                    {dayData.enabled ? `${dayData.start} - ${dayData.end}` : 'Unavailable'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {dayData.enabled && (
                              <div className="flex items-center space-x-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Start</Label>
                                    <Input 
                                      type="time" 
                                      value={dayData.start}
                                      onChange={(e) => setWeeklySchedule(prev => ({
                                        ...prev,
                                        [dayKey]: { ...prev[dayKey], start: e.target.value }
                                      }))}
                                      className="w-24 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">End</Label>
                                    <Input 
                                      type="time" 
                                      value={dayData.end}
                                      onChange={(e) => setWeeklySchedule(prev => ({
                                        ...prev,
                                        [dayKey]: { ...prev[dayKey], end: e.target.value }
                                      }))}
                                      className="w-24 text-sm"
                                    />
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="px-6">Reset to Default</Button>
                  <Button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="special" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Special Days & Exceptions</h3>
                    <p className="text-gray-600">Override your regular schedule for specific dates</p>
                  </div>
                  <AddSpecialDayDialog />
                </div>

                <div className="grid gap-4">
                  {specialDays.map((specialDay, index) => (
                    <Card key={index} className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{specialDay.date}</h4>
                              <p className="text-sm text-gray-600">{specialDay.reason}</p>
                              {specialDay.hours && (
                                <p className="text-sm text-gray-500">{specialDay.hours}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={specialDay.color}>
                              {specialDay.type === 'unavailable' ? 'Unavailable' : 'Custom Hours'}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {specialDays.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <Calendar className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No special days set</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      Add special days to override your regular schedule for holidays, vacations, or custom hours.
                    </p>
                    <AddSpecialDayDialog />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}