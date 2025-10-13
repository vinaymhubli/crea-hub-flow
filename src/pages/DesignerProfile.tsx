import { useState, useEffect, useRef } from 'react';
import { 
  Eye,
  Star,
  Camera,
  ChevronRight,
  Upload,
  X,
  User,
  Settings,
  FolderOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DesignerSidebar } from '@/components/DesignerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


export default function DesignerProfile() {
  const { user, refetchProfile } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  
  // Local state for avatar image to ensure instant UI updates
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const { 
    designerProfile, 
    loading: designerLoading, 
    updateDesignerProfile, 
    updateProfile,
    uploadAvatar,
    uploadPortfolioImage,
    deletePortfolioImage
  } = useDesignerProfile();

  // Initialize avatar image when profile loads
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarImage(profile.avatar_url);
    } else {
      setAvatarImage(null);
    }
  }, [profile?.avatar_url]);

  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Profile data
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    phone: '',
    
    // Designer data
    bio: '',
    location: '',
    specialty: 'General Design',
    hourly_rate: 50,
    experience_years: 0,
    display_hourly_rate: true,
    available_for_urgent: false,
    response_time: '1 hour',
    skills: [] as string[],
    portfolio_images: [] as string[]
  });

  const skillOptions = [
    "Adobe Photoshop",
    "Adobe Illustrator", 
    "Adobe InDesign",
    "Figma",
    "Sketch",
    "3D Modeling",
    "Motion Graphics",
    "Hand Drawing",
    "Typography"
  ];

  // Load data when profile/designer data changes
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (designerProfile) {
      setFormData(prev => ({
        ...prev,
        bio: designerProfile.bio || '',
        location: designerProfile.location || '',
        specialty: designerProfile.specialty || 'General Design',
        hourly_rate: designerProfile.hourly_rate || 50,
        experience_years: designerProfile.experience_years || 0,
        display_hourly_rate: designerProfile.display_hourly_rate ?? true,
        available_for_urgent: designerProfile.available_for_urgent ?? false,
        response_time: designerProfile.response_time || '1 hour',
        skills: designerProfile.skills || [],
        portfolio_images: designerProfile.portfolio_images || []
      }));
    }
  }, [designerProfile]);

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = formData.skills;
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    handleInputChange('skills', newSkills);
  };

  const handleSavePersonal = async () => {
    setIsSaving(true);
    try {
      // Update profile data
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        display_name: formData.display_name,
        email: formData.email,
        phone: formData.phone
      });

      // Update designer data
      await updateDesignerProfile({
        bio: formData.bio,
        location: formData.location
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfessional = async () => {
    setIsSaving(true);
    try {
      await updateDesignerProfile({
        specialty: formData.specialty,
        hourly_rate: formData.hourly_rate,
        experience_years: formData.experience_years,
        display_hourly_rate: formData.display_hourly_rate,
        available_for_urgent: formData.available_for_urgent,
        response_time: formData.response_time,
        skills: formData.skills
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const result = await uploadAvatar(file);
        if (result) {
          // Update local state immediately for instant UI update
          setAvatarImage(result);
          // Also refresh the profile data in the background
          refetchProfile();
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      console.log('Removing avatar...');
      
      // Direct Supabase call to set avatar_url to null
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error removing avatar:', error);
        toast({
          title: "Error",
          description: "Failed to remove profile image",
          variant: "destructive",
        });
        return;
      }

      console.log('Avatar removed successfully');
      // Update local state immediately for instant UI update
      setAvatarImage(null);
      // Also refresh the profile data in the background
      refetchProfile();
      toast({
        title: "Success",
        description: "Profile image removed successfully",
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Error",
        description: "Failed to remove profile image",
        variant: "destructive",
      });
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const imageUrl = await uploadPortfolioImage(files[i]);
        if (imageUrl) {
          newImages.push(imageUrl);
        }
      }
      
      if (newImages.length > 0) {
        const updatedImages = [...formData.portfolio_images, ...newImages];
        handleInputChange('portfolio_images', updatedImages);
        await updateDesignerProfile({ portfolio_images: updatedImages });
      }
    }
  };

  const handleRemovePortfolioImage = async (imageUrl: string) => {
    const success = await deletePortfolioImage(imageUrl);
    if (success) {
      const updatedImages = formData.portfolio_images.filter(img => img !== imageUrl);
      handleInputChange('portfolio_images', updatedImages);
      await updateDesignerProfile({ portfolio_images: updatedImages });
    }
  };

  const getInitials = () => {
    if (formData.display_name) {
      return formData.display_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return 'D';
  };

  const getDisplayName = () => {
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
    }
    if (formData.display_name) return formData.display_name;
    return 'Designer';
  };

  if (profileLoading || designerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Enhanced Header with Profile Preview */}
          <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-4 sm:px-6 py-4 sm:py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2 flex-shrink-0" />
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  {avatarImage ? (
                    <img 
                      src={avatarImage} 
                      alt="Profile" 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-white/30 shadow-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
                      <span className="text-white font-bold text-base sm:text-xl">{getInitials()}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">Designer Profile</h1>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-lg truncate">
                      {getDisplayName()} <span className="hidden sm:inline">• {formData.specialty} • {formData.experience_years}+ years experience</span>
                    </p>
                    <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-300 text-yellow-300" />
                        <span className="text-white/90 font-medium text-xs sm:text-sm">{designerProfile?.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {designerProfile?.is_online ? 'Available' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                asChild 
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto justify-center"
                disabled={!designerProfile?.id}
              >
                <Link 
                  to={`/designer/${designerProfile?.id}`}
                  state={{ hideGlobalChrome: true, fromProfile: true }}
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">View Public Profile</span>
                  <span className="sm:hidden">View Public</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Enhanced Tab Navigation */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-1.5 sm:p-2 mb-6 sm:mb-8 overflow-x-auto">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-transparent gap-1.5 sm:gap-2 min-w-max sm:min-w-0 !h-fit">
                  <TabsTrigger 
                    value="personal" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Personal Info</span>
                    <span className="sm:hidden">Personal</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="professional" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Professional
                  </TabsTrigger>
                  <TabsTrigger 
                    value="portfolio" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Reviews
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="personal" className="space-y-6 sm:space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Profile Picture Section */}
                  <div className="lg:col-span-1">
                    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <CardHeader className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 text-white text-center py-4 sm:py-6 lg:py-8">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Profile Picture</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                        <div className="relative group">
                          {avatarImage ? (
                            <img 
                              src={avatarImage} 
                              alt="Profile" 
                              className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover mx-auto shadow-2xl group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-105 transition-transform duration-300">
                              <span className="text-white font-bold text-2xl sm:text-3xl">{getInitials()}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                          <Button 
                            onClick={() => avatarInputRef.current?.click()}
                            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full text-sm sm:text-base"
                          >
                            <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Change Photo
                          </Button>
                          {avatarImage && (
                            <Button 
                              onClick={handleRemoveAvatar}
                              variant="outline"
                              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200 text-sm sm:text-base"
                            >
                              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Remove Photo
                            </Button>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">Upload a professional headshot</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Personal Information Section */}
                  <div className="lg:col-span-2">
                    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <CardHeader className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 text-white p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold flex items-center">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Personal Information
                        </CardTitle>
                        <CardDescription className="text-white/80 text-xs sm:text-sm">Update your personal details and contact information</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              First name
                            </Label>
                            <Input 
                              id="firstName" 
                              placeholder="First name" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.first_name}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              Last name
                            </Label>
                            <Input 
                              id="lastName" 
                              placeholder="Last name" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.last_name}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="displayName" className="text-sm font-semibold text-gray-700 flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              Display name
                            </Label>
                            <Input 
                              id="displayName" 
                              placeholder="Display name" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.display_name}
                              onChange={(e) => handleInputChange('display_name', e.target.value)}
                            />
                            <p className="text-sm text-gray-500">This is how your name will appear publicly.</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                              <span className="w-4 h-4 mr-1">📧</span>
                              Email
                            </Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="your.email@example.com" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center">
                              <span className="w-4 h-4 mr-1">📱</span>
                              Phone (optional)
                            </Label>
                            <Input 
                              id="phone" 
                              placeholder="+91 1234567890" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center">
                              <span className="w-4 h-4 mr-1">📍</span>
                              Location
                            </Label>
                            <Input 
                              id="location" 
                              placeholder="Delhi, India" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                            />
                            <p className="text-sm text-gray-500">City, Country where you're based</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 flex items-center">
                            <span className="w-4 h-4 mr-1">✍️</span>
                            Professional Bio
                          </Label>
                          <Textarea 
                            id="bio" 
                            placeholder="Tell potential clients about yourself..." 
                            className="min-h-32 border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                          />
                          <p className="text-sm text-gray-500">Describe your background, experience, and what makes you unique.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 md:col-span-2">
                          <Button variant="outline" className="border-gray-300 hover:border-gray-400 px-6 w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                          <Button 
                            onClick={handleSavePersonal}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 w-full sm:w-auto order-1 sm:order-2"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4 sm:space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Professional Information</CardTitle>
                    <CardDescription className="text-white/80 text-xs sm:text-sm">Update your professional details and specializations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">Primary Specialization</Label>
                        <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                          <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-200">
                            <SelectValue placeholder="Select your primary design specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                            <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                            <SelectItem value="Web Design">Web Design</SelectItem>
                            <SelectItem value="Branding">Branding</SelectItem>
                            <SelectItem value="Illustration">Illustration</SelectItem>
                            <SelectItem value="Motion Graphics">Motion Graphics</SelectItem>
                            <SelectItem value="General Design">General Design</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">Years of Experience</Label>
                        <Input 
                          id="experience" 
                          type="number" 
                          placeholder="0" 
                          className="border-gray-200 focus:border-green-400 focus:ring-green-200" 
                          value={formData.experience_years}
                          onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate" className="text-sm font-semibold text-gray-700">Per Minute Rate (₹)</Label>
                        <Input 
                          id="hourlyRate" 
                          type="number" 
                          placeholder="0" 
                          className="border-gray-200 focus:border-green-400 focus:ring-green-200" 
                          value={formData.hourly_rate}
                          onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs sm:text-sm text-gray-500">The rate you charge per minute for your design services</p>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div className="min-w-0 flex-1">
                            <Label className="font-semibold text-gray-700 text-sm sm:text-base">Display Per Minute Rate</Label>
                            <p className="text-xs sm:text-sm text-gray-500">Show your per minute rate on your public profile</p>
                          </div>
                          <Switch 
                            checked={formData.display_hourly_rate} 
                            onCheckedChange={(checked) => handleInputChange('display_hourly_rate', checked)}
                            className="flex-shrink-0"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div className="min-w-0 flex-1">
                            <Label className="font-semibold text-gray-700 text-sm sm:text-base">Available for Urgent Work</Label>
                            <p className="text-xs sm:text-sm text-gray-500">Show that you're available for urgent/rush projects</p>
                          </div>
                          <Switch 
                            checked={formData.available_for_urgent} 
                            onCheckedChange={(checked) => handleInputChange('available_for_urgent', checked)}
                            className="flex-shrink-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responseTime" className="text-sm font-semibold text-gray-700">Response Time</Label>
                      <Select value={formData.response_time} onValueChange={(value) => handleInputChange('response_time', value)}>
                        <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-200">
                          <SelectValue placeholder="Select your typical response time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-15 minutes">Within 5-15 minutes</SelectItem>
                          <SelectItem value="1 hour">Within 1 hour</SelectItem>
                          <SelectItem value="2 hours">Within 2 hours</SelectItem>
                          <SelectItem value="6 hours">Within 6 hours</SelectItem>
                          <SelectItem value="12 hours">Within 12 hours</SelectItem>
                          <SelectItem value="24 hours">Within 24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-sm font-semibold text-gray-700">Additional Skills</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {skillOptions.map((skill) => (
                          <div key={skill} className="flex items-center space-x-2 p-2 sm:p-2.5 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 hover:border-green-200 transition-colors">
                            <Checkbox 
                              id={skill}
                              checked={formData.skills.includes(skill)}
                              onCheckedChange={() => handleSkillToggle(skill)}
                              className="border-green-300 flex-shrink-0"
                            />
                            <Label htmlFor={skill} className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">{skill}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3">
                      <Button variant="outline" className="border-gray-300 hover:border-gray-400 w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                      <Button 
                        onClick={handleSaveProfessional}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto order-1 sm:order-2"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4 sm:space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Portfolio</CardTitle>
                        <CardDescription className="text-white/80 text-xs sm:text-sm">Showcase your best design work to attract more clients</CardDescription>
                      </div>
                      <div>
                        <input
                          ref={portfolioInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePortfolioUpload}
                          className="hidden"
                        />
                        <Button 
                          onClick={() => portfolioInputRef.current?.click()}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
                        >
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Add Images
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {formData.portfolio_images.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {formData.portfolio_images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={imageUrl} 
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemovePortfolioImage(imageUrl)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12 lg:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                          <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">No portfolio items</h3>
                        <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-4">Get started by adding your first portfolio item.</p>
                        <Button 
                          onClick={() => portfolioInputRef.current?.click()}
                          className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                        >
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Add Portfolio Item
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 sm:space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-bold">Reviews</CardTitle>
                    <CardDescription className="text-white/80 text-xs sm:text-sm">View client reviews of your design services.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <Star className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                            <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                              {designerProfile?.rating?.toFixed(1) || '0.0'}
                            </span>
                            <div className="flex space-x-0.5 sm:space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 sm:w-6 sm:h-6 fill-yellow-400 text-yellow-400 hover:scale-110 transition-transform" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                            Based on {designerProfile?.reviews_count || 0} reviews
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <p className="text-xs sm:text-sm text-gray-600 font-semibold">Completion rate</p>
                        <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                          {designerProfile?.completion_rate || 0}%
                        </p>
                        <p className="text-xs sm:text-sm text-green-600 font-medium">✓ Projects completed</p>
                      </div>
                    </div>

                    {designerProfile?.reviews_count === 0 && (
                      <div className="text-center py-8 sm:py-12 lg:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                          <Star className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">No reviews yet</h3>
                        <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-4">Complete your first project to start getting reviews!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}