import { useState } from 'react';
import { Send, Search, MoreVertical, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const conversations = [
  {
    id: 1,
    clientName: "Sarah Johnson",
    clientAvatar: "/api/placeholder/40/40",
    lastMessage: "Thank you for the amazing logo design! I have a few questions about the revisions.",
    timestamp: "2 min ago",
    unread: 3,
    status: "active"
  },
  {
    id: 2,
    clientName: "Mike Chen",
    clientAvatar: "/api/placeholder/40/40",
    lastMessage: "When can we schedule the next design session?",
    timestamp: "1 hour ago",
    unread: 1,
    status: "pending"
  },
  {
    id: 3,
    clientName: "Emma Davis",
    clientAvatar: "/api/placeholder/40/40",
    lastMessage: "The website mockups look fantastic! Let's finalize the color scheme.",
    timestamp: "3 hours ago",
    unread: 0,
    status: "completed"
  },
];

const messages = [
  {
    id: 1,
    sender: "client",
    message: "Hi! I'm really excited to work with you on my brand identity project.",
    timestamp: "10:30 AM",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: 2,
    sender: "designer",
    message: "Hello Sarah! I'm thrilled to work with you too. I've reviewed your brief and have some great ideas. When would be a good time for our initial consultation?",
    timestamp: "10:35 AM"
  },
  {
    id: 3,
    sender: "client", 
    message: "Perfect! I'm available tomorrow afternoon or Friday morning. Also, I've attached some inspiration images that align with the vision I have in mind.",
    timestamp: "10:40 AM",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: 4,
    sender: "designer",
    message: "Friday morning works perfectly for me! I'll send you a calendar invite. The inspiration images you shared are excellent - I can see the aesthetic you're going for. I'll prepare some initial concepts to discuss during our call.",
    timestamp: "10:45 AM"
  },
];

export default function DesignerMessages() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle message sending logic here
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Messages
          </h1>
          <p className="text-gray-600">Communicate with your clients and manage project discussions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>Conversations</span>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {conversations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="overflow-y-auto max-h-[500px]">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedConversation.id === conversation.id ? 'bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conversation.clientAvatar} />
                          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                            {conversation.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                          conversation.status === 'active' ? 'bg-green-500' : 
                          conversation.status === 'pending' ? 'bg-yellow-500' : 
                          'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{conversation.clientName}</h3>
                          {conversation.unread > 0 && (
                            <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conversation.lastMessage}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {conversation.timestamp}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              conversation.status === 'active' ? 'border-green-500 text-green-600' :
                              conversation.status === 'pending' ? 'border-yellow-500 text-yellow-600' :
                              'border-gray-400 text-gray-600'
                            }`}
                          >
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 overflow-hidden border-0 shadow-lg flex flex-col">
            {/* Chat Header */}
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.clientAvatar} />
                    <AvatarFallback className="bg-white/20 text-white">
                      {selectedConversation.clientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.clientName}</h3>
                    <p className="text-white/80 text-sm">Project: Brand Identity Design</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'designer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[70%] ${
                      message.sender === 'designer' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {message.sender === 'client' && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.avatar} />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {selectedConversation.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'designer'
                          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'designer' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] resize-none border-gray-300 focus:border-green-500"
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift + Enter for new line</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}