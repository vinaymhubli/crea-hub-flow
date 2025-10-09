import { useState, useEffect } from 'react';
import { useDesignerSlots } from '@/hooks/useDesignerSlots';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { SlotManagementDialog } from './SlotManagementDialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CheckCircle, Clock, Calendar, User, Star, ArrowRight, ArrowLeft, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DesignerOnboardingProps {
  onComplete: () => void;
}

export function DesignerOnboarding({ onComplete }: DesignerOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const {
    slots,
    loading,
    getSlotsForDay,
    getTotalWeeklyHours
  } = useDesignerSlots();
  const { designerProfile, updateDesignerProfile } = useDesignerProfile();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const steps = [
    {
      id: 1,
      title: "Welcome!",
      description: "Let's set up your designer profile and schedule",
      icon: <User className="w-8 h-8" />,
    },
    {
      id: 2,
      title: "Set Your Schedule",
      description: "Add your available time slots for each day",
      icon: <Calendar className="w-8 h-8" />,
    },
    {
      id: 3,
      title: "Review & Complete",
      description: "Review your setup and start accepting bookings",
      icon: <CheckCircle className="w-8 h-8" />,
    },
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const verificationStatus = (designerProfile as any)?.verification_status || 'pending';
  const isVerified = verificationStatus === 'verified';

  // Derived aggregates for current slots
  const totalSlots = (slots || []).filter((s: any) => s.is_active).length;
  const totalHours = getTotalWeeklyHours ? getTotalWeeklyHours() : 0;
  const slotsByDay: Record<number, any[]> = {};
  for (let i = 0; i < 7; i++) {
    slotsByDay[i] = getSlotsForDay ? getSlotsForDay(i) : [];
  }

  const handleSlotDialogOpen = (day: number) => {
    if (!isVerified) return; // gate until verified
    setSelectedDay(day);
    setIsSlotDialogOpen(true);
  };

  const handleSlotDialogClose = () => {
    setIsSlotDialogOpen(false);
    setSelectedDay(null);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      await updateDesignerProfile({
        onboarding_completed: true
      });
      
      toast({
        title: "Welcome to meetmydesigners!",
        description: "Your setup is complete. You can now start accepting bookings!",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canProceedFromStep2 = isVerified && totalSlots > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={() => signOut()}
            className="absolute right-0 -top-2 text-sm bg-white border rounded-lg px-3 py-1 shadow hover:bg-gray-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to meetmydesigners!
          </h1>
          <p className="text-lg text-gray-600">
            Let's get your designer profile set up in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {steps.map((step) => (
            <Card 
              key={step.id} 
              className={`transition-all duration-200 ${
                currentStep >= step.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto mb-2 ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[Math.max(0, currentStep - 1)].icon}
              {steps[Math.max(0, currentStep - 1)].title}
            </CardTitle>
            <CardDescription>
              {steps[Math.max(0, currentStep - 1)].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Profile Created Successfully!</h3>
                  <p className="text-gray-600">
                    Your designer profile has been created and is pending admin verification.
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Verification Status</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Your profile is pending admin approval. You'll be notified once verified. You can set your schedule only after verification.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Set Your Weekly Schedule</h3>
                  {isVerified ? (
                    <p className="text-gray-600">
                      Add your available time slots for each day. You can have up to 6 slots per day.
                    </p>
                  ) : (
                    <p className="text-yellow-700">
                      You can set your schedule after admin verification. Please check back once verified.
                    </p>
                  )}
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!isVerified ? 'opacity-50 pointer-events-none' : ''}`}>
                  {dayNames.map((dayName, dayIndex) => {
                    const daySlots = slotsByDay[dayIndex] || [];
                    const slotCount = daySlots.length;
                    
                    return (
                      <Card 
                        key={dayIndex}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          slotCount > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleSlotDialogOpen(dayIndex)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{dayName}</h4>
                            <Badge variant={slotCount > 0 ? 'default' : 'secondary'}>
                              {slotCount} slot{slotCount !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          {slotCount > 0 ? (
                            <div className="space-y-1">
                              {daySlots.slice(0, 2).map((slot, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                  {slot.start_time} - {slot.end_time}
                                </div>
                              ))}
                              {slotCount > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{slotCount - 2} more...
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No slots added</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {isVerified && totalSlots > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Schedule Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Total Slots:</span>
                        <span className="ml-2 font-medium">{totalSlots}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Total Hours:</span>
                        <span className="ml-2 font-medium">{Number(totalHours).toFixed(1)}h</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-gray-600">
                    Your profile and schedule are ready. Here's what you've set up:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Your Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Slots:</span>
                          <span className="font-medium">{totalSlots}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Hours:</span>
                          <span className="font-medium">{totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Days:</span>
                          <span className="font-medium">
                            {Array.from({ length: 7 }).filter((_, i) => (slotsByDay[i] || []).length > 0).length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5" />
                        Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Profile created
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Schedule set up
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          Awaiting verification
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          Start accepting bookings
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 2 && !canProceedFromStep2}
              className="flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Setup
            </Button>
          )}
        </div>

        {/* Slot Management Dialog */}
        {selectedDay !== null && (
          <SlotManagementDialog
            isOpen={isSlotDialogOpen}
            onOpenChange={(open: boolean) => { if (!open) handleSlotDialogClose(); }}
            dayOfWeek={selectedDay}
            dayName={dayNames[selectedDay]}
            existingSlots={slotsByDay[selectedDay] || []}
            onSaveSlots={async () => {}}
            onDeleteSlot={async () => {}}
          />
        )}
      </div>
    </div>
  );
}
