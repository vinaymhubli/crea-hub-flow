import { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  MessageCircle, 
  CreditCard,
  Bell,
  Settings,
  Search,
  Users,
  Wallet,
  ChevronRight,
  Star,
  LogOut,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { title: "Dashboard", url: "/customer-dashboard", icon: LayoutDashboard },
  { title: "Find Designer", url: "/designers", icon: Search },
  { title: "My Bookings", url: "/customer-dashboard/bookings", icon: Calendar },
  { title: "Messages", url: "/customer-dashboard/messages", icon: MessageCircle },
  { title: "Recent Designers", url: "/customer-dashboard/recent-designers", icon: Users },
  { title: "Wallet", url: "/customer-dashboard/wallet", icon: Wallet },
  { title: "Notifications", url: "/customer-dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/customer-dashboard/profile", icon: User },
  { title: "Settings", url: "/customer-dashboard/settings", icon: Settings },
];

const mockConversations = [
  {
    id: 1,
    designer: "Emma Thompson",
    lastMessage: "Hi! I've finished the initial logo concepts. Would you like to review them?",
    timestamp: "2 min ago",
    unread: 2,
    online: true,
    avatar: "EM",
    rating: 4.9
  },
  {
    id: 2,
    designer: "Marcus Chen",
    lastMessage: "Thanks for the feedback! I'll make those adjustments to the UI design.",
    timestamp: "1 hour ago",
    unread: 0,
    online: false,
    avatar: "MC",
    rating: 4.7
  },
  {
    id: 3,
    designer: "Sophie Williams",
    lastMessage: "The brand identity package is ready for download. Let me know if you need any changes!",
    timestamp: "Yesterday",
    unread: 1,
    online: true,
    avatar: "SW",
    rating: 4.8
  },
  {
    id: 4,
    designer: "Alex Johnson",
    lastMessage: "Perfect! I'll start working on the website mockups based on your requirements.",
    timestamp: "2 days ago",
    unread: 0,
    online: false,
    avatar: "AJ",
    rating: 4.6
  }
];

const mockMessages = [
  {
    id: 1,
    sender: "designer",
    message: "Hi Viaan! Thanks for booking the logo design session. I'm excited to work on your project!",
    timestamp: "10:30 AM",
    avatar: "EM"
  },
  {
    id: 2,
    sender: "customer",
    message: "Hi Emma! Thanks for accepting my booking. I'm looking forward to working with you too.",
    timestamp: "10:32 AM"
  },
  {
    id: 3,
    sender: "designer",
    message: "Great! I've reviewed your project brief. Could you tell me more about your target audience and the style you're looking for?",
    timestamp: "10:35 AM",
    avatar: "EM"
  },
  {
    id: 4,
    sender: "customer",
    message: "Sure! We're targeting young professionals aged 25-35. We want something modern and clean, but also approachable and friendly.",
    timestamp: "10:40 AM"
  },
  {
    id: 5,
    sender: "designer",
    message: "Perfect! I have some initial concepts in mind. I'll work on a few variations and share them with you in our session tomorrow.",
    timestamp: "10:45 AM",
    avatar: "EM"
  },
  {
    id: 6,
    sender: "designer",
    message: "Hi! I've finished the initial logo concepts. Would you like to review them?",
    timestamp: "Just now",
    avatar: "EM"
  }
];

function CustomerSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">VB</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Viaan Bindra</p>
              <p className="text-sm text-gray-500">Customer</p>
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
                          ? 'bg-gradient-to-r from-green-50 to-blue-50 text-green-600 border-r-2 border-green-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                      {isActive(item.url) && <ChevronRight className="w-4 h-4 ml-auto" />}
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

export default function CustomerMessages() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = mockConversations.filter(conv =>
    conv.designer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-teal-50/30 to-blue-50/20">
        <CustomerSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-br from-green-400 via-teal-500 to-blue-500 text-white px-6 py-8 flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                  <p className="text-green-100">Chat with your designers and collaborate in real-time</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-green-100" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <span className="text-white font-semibold text-sm">VB</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="end">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">VB</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Viaan Bindra</p>
                          <p className="text-sm text-muted-foreground">customer@example.com</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        <Link 
                          to="/customer-dashboard" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/customer-dashboard/wallet" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Wallet className="w-4 h-4 mr-3" />
                          Wallet
                        </Link>
                        <Link 
                          to="/customer-dashboard/profile" 
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                        <Separator className="my-2" />
                        <button className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors">
                          <LogOut className="w-4 h-4 mr-3" />
                          Log out
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Floating decorative elements */}
            <div className="absolute top-4 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 right-32 w-1 h-1 bg-white/20 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-12 right-40 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse delay-500"></div>
          </header>

          <div className="flex-1 flex">
            {/* Conversations List */}
            <div className="w-80 bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-r border-teal-200/30 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-teal-200/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-500 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-teal-200/20 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 ${
                      selectedConversation.id === conversation.id
                        ? 'bg-gradient-to-r from-teal-100 to-blue-100 border-teal-300'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-semibold text-sm">{conversation.avatar}</span>
                        </div>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-foreground truncate">{conversation.designer}</p>
                          <div className="flex items-center space-x-1">
                            {conversation.unread > 0 && (
                              <Badge className="bg-gradient-to-r from-green-400 to-teal-500 text-white text-xs px-2 py-1 shadow-lg">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 mb-2">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-muted-foreground">{conversation.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{conversation.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-gradient-to-br from-background to-teal-50/10">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-b border-teal-200/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">{selectedConversation.avatar}</span>
                          </div>
                          {selectedConversation.online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{selectedConversation.designer}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-sm text-muted-foreground">{selectedConversation.rating}</span>
                            {selectedConversation.online && (
                              <span className="text-sm text-green-600">• Online</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <Info className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {mockMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === 'customer' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                            message.sender === 'customer'
                              ? 'bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white'
                              : 'bg-white text-foreground border border-teal-200/30'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === 'customer' ? 'text-green-100' : 'text-muted-foreground'
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="bg-gradient-to-br from-card via-teal-50/20 to-blue-50/10 border-t border-teal-200/30 p-4">
                    <div className="flex items-center space-x-3">
                      <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type a message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="pr-20 border-teal-200/50 focus:border-teal-400 focus:ring-teal-400/20"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="hover:bg-teal-100">
                            <Smile className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={handleSendMessage} 
                            size="sm"
                            className="bg-gradient-to-r from-green-400 to-teal-500 text-white hover:shadow-lg transition-all duration-300"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Select a conversation</h3>
                    <p className="text-sm text-muted-foreground">Choose a designer to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}