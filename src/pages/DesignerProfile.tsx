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
  Eye,
  Star,
  Camera,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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

const sidebarItems = [
  { title: "Dashboard", url: "/designer-dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/designer-dashboard/profile", icon: User },
  { title: "Portfolio", url: "/designer-dashboard/portfolio", icon: FolderOpen },
  { title: "Bookings", url: "/designer-dashboard/bookings", icon: Calendar },
  { title: "Availability", url: "/designer-dashboard/availability", icon: Clock },
  { title: "Earnings", url: "/designer-dashboard/earnings", icon: DollarSign },
  { title: "Session History", url: "/designer-dashboard/history", icon: History },
  { title: "Settings", url: "/designer-dashboard/settings", icon: Settings },
];

function DesignerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vb Bn</p>
              <p className="text-sm text-gray-500">Designer</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.url} 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 border-r-2 border-green-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive(item.url) ? 'text-green-600' : ''}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
    </Sidebar>
  );
}

export default function DesignerProfile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [displayHourlyRate, setDisplayHourlyRate] = useState(true);
  const [availableUrgent, setAvailableUrgent] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const skills = [
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

  const handleSkillChange = (skill: string, checked: boolean) => {
    if (checked) {
      setSelectedSkills([...selectedSkills, skill]);
    } else {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <DesignerSidebar />
        
        <main className="flex-1">
          {/* Clean Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">VB</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-600">Manage your designer profile and preferences</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Preview Profile</span>
              </Button>
            </div>
          </header>

          <div className="p-6 max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Simple Tab Navigation */}
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-gray-200">
                <TabsTrigger value="personal" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="professional" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                  Professional
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Profile Picture Section */}
                  <div className="lg:col-span-1">
                    <Card className="bg-white border border-gray-200">
                      <CardHeader className="text-center pb-4">
                        <CardTitle className="text-lg">Profile Picture</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-white font-semibold text-2xl">VB</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Personal Information Section */}
                  <div className="lg:col-span-3">
                    <Card className="bg-white border border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                        <CardDescription>Update your personal details and contact information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              First name
                            </Label>
                            <Input 
                              id="firstName" 
                              placeholder="First name" 
                              className="border-gray-200 focus:border-green-400 focus:ring-green-200 hover:border-green-300 transition-colors"
                              defaultValue="Vb"
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
                              defaultValue="Bn"
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
                              defaultValue="VB Design Studio"
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
                              defaultValue="vb@designstudio.com"
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
                              defaultValue="Mumbai, India"
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
                            defaultValue="Experienced UI/UX designer with 5+ years in creating intuitive digital experiences. Specializing in user-centered design, prototyping, and design systems."
                          />
                          <p className="text-sm text-gray-500">Describe your background, experience, and what makes you unique.</p>
                        </div>

                        <div className="flex justify-end space-x-3 md:col-span-2">
                          <Button variant="outline" className="border-gray-300 hover:border-gray-400 px-6">Cancel</Button>
                          <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6">
                            Save Changes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold">Professional Information</CardTitle>
                    <CardDescription className="text-white/80">Update your professional details and specializations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="text-sm font-semibold text-gray-700">Primary Specialization</Label>
                        <Select>
                          <SelectTrigger className="border-gray-200 focus:border-green-400 focus:ring-green-200">
                            <SelectValue placeholder="Select your primary design specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ui-ux">UI/UX Design</SelectItem>
                            <SelectItem value="graphic">Graphic Design</SelectItem>
                            <SelectItem value="web">Web Design</SelectItem>
                            <SelectItem value="branding">Branding</SelectItem>
                            <SelectItem value="illustration">Illustration</SelectItem>
                            <SelectItem value="motion">Motion Graphics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">Years of Experience</Label>
                        <Input id="experience" type="number" placeholder="0" className="border-gray-200 focus:border-green-400 focus:ring-green-200" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate" className="text-sm font-semibold text-gray-700">Hourly Rate (₹)</Label>
                        <Input id="hourlyRate" type="number" placeholder="0" className="border-gray-200 focus:border-green-400 focus:ring-green-200" />
                        <p className="text-sm text-gray-500">The rate you charge per hour for your design services</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div>
                            <Label className="font-semibold text-gray-700">Display Hourly Rate</Label>
                            <p className="text-sm text-gray-500">Show your hourly rate on your public profile</p>
                          </div>
                          <Switch checked={displayHourlyRate} onCheckedChange={setDisplayHourlyRate} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div>
                            <Label className="font-semibold text-gray-700">Available for Urgent Work</Label>
                            <p className="text-sm text-gray-500">Show that you're available for urgent/rush projects</p>
                          </div>
                          <Switch checked={availableUrgent} onCheckedChange={setAvailableUrgent} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-gray-700">Additional Skills</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {skills.map((skill) => (
                          <div key={skill} className="flex items-center space-x-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100 hover:border-green-200 transition-colors">
                            <Checkbox 
                              id={skill}
                              checked={selectedSkills.includes(skill)}
                              onCheckedChange={(checked) => handleSkillChange(skill, checked as boolean)}
                              className="border-green-300"
                            />
                            <Label htmlFor={skill} className="text-sm font-medium text-gray-700">{skill}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" className="border-gray-300 hover:border-gray-400">Cancel</Button>
                      <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">Portfolio</CardTitle>
                        <CardDescription className="text-white/80">Showcase your best design work to attract more clients</CardDescription>
                      </div>
                      <Button className="bg-white/20 hover:bg-white/30 text-white border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
                        <span className="mr-2">+</span>
                        Add Portfolio Item
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="flex space-x-8">
                        {["All Works", "Logo Design", "Branding", "UI/UX Design", "Print Design", "Illustration", "Web Design", "Other"].map((category) => (
                          <button
                            key={category}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors hover:scale-105 ${
                              category === "All Works"
                                ? "border-green-500 text-green-600 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg px-3"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </nav>
                    </div>

                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FolderOpen className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">No portfolio items</h3>
                      <p className="text-gray-500 mb-8 text-lg">Get started by adding your first portfolio item.</p>
                      <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                        <span className="mr-2">+</span>
                        Add Portfolio Item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6 animate-fade-in">
                <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold">Reviews</CardTitle>
                    <CardDescription className="text-white/80">View and manage client reviews of your design services.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center shadow-lg">
                          <Star className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">4.9</span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400 hover:scale-110 transition-transform" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Based on 12 reviews</p>
                        </div>
                      </div>
                      <div className="text-right p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 font-semibold">Your response rate</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">100%</p>
                        <p className="text-sm text-green-600 font-medium">✓ All reviews responded</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Samantha Mehta</h4>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">2 weeks ago</p>
                            <Badge variant="outline" className="mt-1">Logo Design</Badge>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">
                          Absolutely amazing work! The designer understood our brand instantly and delivered a logo that perfectly captures our company's essence. The communication was excellent throughout the process, and they were very responsive to feedback. Would definitely hire again!
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Your Response</span>
                            <span className="text-sm text-gray-500">1 week ago</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Thank you so much for the kind words, Samantha! It was a pleasure working with you and I'm thrilled that you're happy with the final logo. Looking forward to collaborating on future projects!
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Vikram Patel</h4>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">1 month ago</p>
                            <Badge variant="outline" className="mt-1">Web Design</Badge>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          Outstanding web design work! The designer created a modern, user-friendly interface that exceeded our expectations. Great attention to detail and excellent communication.
                        </p>
                      </div>
                    </div>
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