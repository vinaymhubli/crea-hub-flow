import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  User, 
  FolderOpen, 
  Calendar, 
  Clock, 
  DollarSign, 
  History, 
  Settings,
  Plus,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  LogOut
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DesignerSidebar } from "@/components/DesignerSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { useDesignerAvailability } from '@/hooks/useDesignerAvailability';
import { useDesignerSlots } from '@/hooks/useDesignerSlots';
import { SlotManagementDialog } from '@/components/SlotManagementDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/NotificationBell';


interface AddSpecialDayDialogProps {
  onAddSpecialDay: (date: string, isAvailable: boolean, startTime?: string, endTime?: string, reason?: string) => void;
}

function AddSpecialDayDialog({ onAddSpecialDay }: AddSpecialDayDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");

  const handleAddSpecialDay = () => {
    if (date) {
      onAddSpecialDay(
        date,
        isAvailable,
        isAvailable ? startTime : undefined,
        isAvailable ? endTime : undefined,
        reason || undefined
      );
      setIsOpen(false);
      setDate("");
      setIsAvailable(true);
      setStartTime("09:00");
      setEndTime("17:00");
      setReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 rounded-xl px-6 py-2.5 border-0 font-medium">
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
            <Input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
                <Input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input 
              id="reason" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Holiday, Personal time, etc."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-6 py-2.5 border-gray-300 hover:bg-gray-50 font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddSpecialDay}
              disabled={!date}
              className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white rounded-xl px-6 py-2.5 border-0 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const { toast } = useToast();

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : user?.email ? user.email.substring(0, 2).toUpperCase()
    : 'D';

  const userDisplayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split('@')[0] || 'Designer';
  const {
    loading: availabilityLoading,
    settings,
    weeklySchedule,
    specialDays,
    updateSettings,
    updateWeeklySchedule,
    addSpecialDay,
    deleteSpecialDay,
  } = useDesignerAvailability();
  
  const {
    slots,
    loading: slotsLoading,
    getSlotsForDay,
    saveSlotsForDay,
    deleteSlot,
    getTotalWeeklyHours,
    getSlotsCountPerDay,
    getDayName,
    getDuration,
    copySlotsToAllDays
  } = useDesignerSlots();

  const weekDays = [
    { name: "Monday", value: 1 },
    { name: "Tuesday", value: 2 },
    { name: "Wednesday", value: 3 },
    { name: "Thursday", value: 4 },
    { name: "Friday", value: 5 },
    { name: "Saturday", value: 6 },
    { name: "Sunday", value: 0 }
  ];

  // Get schedule for a specific day
  const getScheduleForDay = (dayOfWeek: number) => {
    return weeklySchedule.find(schedule => schedule.day_of_week === dayOfWeek) || {
      is_available: true,
      start_time: "09:00",
      end_time: "17:00"
    };
  };

  const handleSettingsUpdate = async (field: string, value: any) => {
    await updateSettings({ [field]: value });
  };


  const handleSpecialDayAdd = async (date: string, isAvailable: boolean, startTime?: string, endTime?: string, reason?: string) => {
    await addSpecialDay({
      date,
      is_available: isAvailable,
      start_time: startTime,
      end_time: endTime,
      reason
    });
  };

  const toggleDayAvailability = async (dayOfWeek: number) => {
    const currentSchedule = getScheduleForDay(dayOfWeek);
    await updateWeeklySchedule(dayOfWeek, {
      ...currentSchedule,
      is_available: !currentSchedule.is_available
    });
  };

  // Calculate statistics using slots
  const totalHours = getTotalWeeklyHours();
  const slotsCountPerDay = getSlotsCountPerDay();
  const activeDays = Object.values(slotsCountPerDay).filter(count => count > 0).length;
  const totalSlots = Object.values(slotsCountPerDay).reduce((sum, count) => sum + count, 0);
  
  console.log('📊 Total Hours (from slots):', totalHours);
  console.log('📊 Active Days:', activeDays);
  console.log('📊 Total Slots:', totalSlots);
  console.log('📊 Slots per day:', slotsCountPerDay);

  const handleManageSlots = (dayOfWeek: number) => {
    setSelectedDay(dayOfWeek);
    setSlotDialogOpen(true);
  };

  const handleSaveSlots = async (daySlots: any[]) => {
    if (selectedDay === null) return;
    await saveSlotsForDay(selectedDay, daySlots);
  };

  const handleDeleteSlot = async (slotId: string) => {
    await deleteSlot(slotId);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          <DashboardHeader
            title="Availability Management"
            subtitle="Manage your weekly schedule and special day exceptions"
            icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            additionalInfo={
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-1 text-xs sm:text-sm">
                <span className="text-white/90 font-medium">{Math.round(totalHours)} hours/week</span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/90 font-medium">{totalSlots} time slots</span>
                <span className="text-white/60 hidden sm:inline">•</span>
                <span className="text-white/90 font-medium">{activeDays} days active</span>
              </div>
            }
            userInitials={userInitials}
            isOnline={true}
            actionButton={
              <div className="flex items-center space-x-2 sm:space-x-4">
                <NotificationBell />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0">
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {userInitials}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="min-w-64 w-fit p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">{userInitials}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{userDisplayName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link
                          to="/designer-dashboard"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link
                          to="/designer-dashboard/services"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Package className="w-4 h-4 mr-3" />
                          Services
                        </Link>
                        <Link
                          to="/designer-dashboard/earnings"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <DollarSign className="w-4 h-4 mr-3" />
                          Earnings
                        </Link>
                        <Link
                          to="/designer-dashboard/profile"
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button
                          onClick={async () => {
                            try {
                              await signOut();
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            }
          />

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Quick Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                      <Switch 
                        checked={settings?.auto_accept_bookings || false} 
                        onCheckedChange={(checked) => handleSettingsUpdate('auto_accept_bookings', checked)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-gray-700">Buffer time between sessions</Label>
                      <Select 
                        value={settings?.buffer_time_minutes?.toString() || "15"} 
                        onValueChange={(value) => handleSettingsUpdate('buffer_time_minutes', parseInt(value))}
                      >
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

              {/* Quick Setup Card - Middle Position */}
              <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg flex items-center">
                    <Copy className="w-5 h-5 mr-2" />
                    Quick Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Copy slots from one day to all other days</p>
                      <Select onValueChange={(value) => {
                        if (value) {
                          copySlotsToAllDays(parseInt(value));
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day to copy from" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                        <span className="font-semibold text-gray-900">{Math.round(totalHours)} hours</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Time slots:</span>
                        <span className="font-semibold text-blue-600">{totalSlots} slots</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active days:</span>
                        <span className="font-semibold text-green-600">{activeDays} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Special days:</span>
                        <span className="font-semibold text-purple-600">{specialDays.length} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full" style={{ width: `${(activeDays / 7) * 100}%` }}></div>
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

                {slotsLoading ? (
                  <div className="text-center py-8">Loading time slots...</div>
                ) : (
                  <div className="grid gap-4">
                    {weekDays.map((day) => {
                      const daySchedule = getScheduleForDay(day.value);
                      const isDayAvailable = daySchedule.is_available;
                      const daySlots = getSlotsForDay(day.value);
                      const slotsCount = daySlots.length;
                      const totalDayHours = daySlots.reduce((total, slot) => 
                        total + getDuration(slot.start_time, slot.end_time), 0
                      );
                      
                      return (
                        <Card key={day.name} className={`bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${!isDayAvailable ? 'opacity-60' : ''}`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start space-x-3 sm:space-x-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isDayAvailable && slotsCount > 0 
                                    ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                                    : isDayAvailable
                                    ? 'bg-gray-200'
                                    : 'bg-red-200'
                                }`}>
                                  <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${isDayAvailable && slotsCount > 0 ? 'text-white' : isDayAvailable ? 'text-gray-400' : 'text-red-600'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{day.name}</h3>
                                    <div className="flex items-center gap-2">
                                      <Switch 
                                        checked={isDayAvailable}
                                        onCheckedChange={() => toggleDayAvailability(day.value)}
                                        className="data-[state=checked]:bg-green-500"
                                      />
                                      <span className="text-xs text-gray-500">
                                        {isDayAvailable ? 'Available' : 'Unavailable'}
                                      </span>
                                    </div>
                                    {isDayAvailable && (
                                      <>
                                        <Badge variant={slotsCount > 0 ? "default" : "secondary"} className="text-xs">
                                          {slotsCount} slot{slotsCount !== 1 ? 's' : ''}
                                        </Badge>
                                        {totalDayHours > 0 && (
                                          <Badge variant="outline" className="text-xs">
                                            {Math.round(totalDayHours)}h
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    {!isDayAvailable ? (
                                      <p className="text-xs sm:text-sm text-red-600 font-medium">This day is unavailable - no bookings will be accepted</p>
                                    ) : slotsCount === 0 ? (
                                      <p className="text-xs sm:text-sm text-gray-500">No time slots configured - add slots to accept bookings</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {daySlots.map((slot, index) => (
                                          <div key={slot.id} className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600">
                                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                            </span>
                                            <span className="text-gray-400">
                                              ({Math.round(getDuration(slot.start_time, slot.end_time))}h)
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isDayAvailable && (
                                <div className="flex items-center">
                                  <Button
                                    onClick={() => handleManageSlots(day.value)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-lg sm:rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 border-0 w-full sm:w-auto text-sm sm:text-base"
                                    size="sm"
                                  >
                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                                    Manage Slots
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="special" className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Special Days</h3>
                    <p className="text-gray-600">Override your regular schedule for specific dates</p>
                  </div>
                  <AddSpecialDayDialog onAddSpecialDay={handleSpecialDayAdd} />
                </div>

                {availabilityLoading ? (
                  <div className="text-center py-8">Loading special days...</div>
                ) : (
                  <div className="grid gap-4">
                    {specialDays.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No special days configured. Add exceptions to your regular schedule.
                      </div>
                    ) : (
                      specialDays.map((day) => (
                        <Card key={day.id} className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    {new Date(day.date).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {day.is_available 
                                      ? `Available ${day.start_time} - ${day.end_time}` 
                                      : 'Unavailable'
                                    }
                                  </p>
                                  {day.reason && (
                                    <p className="text-xs text-gray-400 mt-1">{day.reason}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge className={day.is_available ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                                  {day.is_available ? 'Custom Hours' : 'Unavailable'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gray-100 transition-all duration-200">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => day.id && deleteSpecialDay(day.id)}
                                    >
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Slot Management Dialog */}
      {selectedDay !== null && (
        <SlotManagementDialog
          isOpen={slotDialogOpen}
          onOpenChange={setSlotDialogOpen}
          dayOfWeek={selectedDay}
          dayName={getDayName(selectedDay)}
          existingSlots={getSlotsForDay(selectedDay).map(slot => ({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active
          }))}
          onSaveSlots={handleSaveSlots}
          onDeleteSlot={handleDeleteSlot}
        />
      )}
    </SidebarProvider>
  );
}