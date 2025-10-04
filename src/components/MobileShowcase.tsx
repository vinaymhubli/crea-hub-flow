
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';

const MobileShowcase = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isLooping, setIsLooping] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  // Single conversation from customer's perspective
  const conversation = [
    { id: 1, type: 'customer', message: 'Hi! I need a logo for my new coffee shop ☕', time: '10:30 AM' },
    { id: 2, type: 'designer', name: 'Sarah Designer', message: 'Hello! I\'d love to help with your coffee shop logo! What style are you thinking?', time: '10:32 AM', avatar: 'S' },
    { id: 3, type: 'customer', message: 'Something modern but cozy, maybe with coffee beans?', time: '10:35 AM' },
    { id: 4, type: 'designer', name: 'Sarah Designer', message: 'Perfect! I\'ll create a few concepts for you. Give me 30 minutes!', time: '10:36 AM', avatar: 'S' },
    { id: 5, type: 'customer', message: 'Thank you! Can\'t wait to see them! 😊', time: '10:38 AM' },
    { id: 6, type: 'designer', name: 'Sarah Designer', message: 'Here are 3 logo concepts! Which direction do you like?', time: '11:15 AM', avatar: 'S' },
    { id: 7, type: 'customer', message: 'I love the second one! Can we try it in blue?', time: '11:18 AM' },
    { id: 8, type: 'designer', name: 'Sarah Designer', message: 'Absolutely! I\'ll create the blue version for you right now!', time: '11:20 AM', avatar: 'S' }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Start the looping chat animation
          setTimeout(() => {
            setIsLooping(true);
            startChatLoop();
          }, 1000);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('mobile-showcase');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const startChatLoop = () => {
    let messageIndex = 0;
    
    const addNextMessage = () => {
      if (messageIndex >= conversation.length) {
        // Reset conversation
        messageIndex = 0;
        setVisibleMessages([]);
        return;
      }
      
      const currentMessage = conversation[messageIndex];
      
      // Show typing indicator for designer messages
      if (currentMessage && currentMessage.type === 'designer') {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(msg => msg.id === currentMessage.id);
            if (exists) return prev;
            return [...prev, currentMessage];
          });
          messageIndex++;
        }, 1500);
      } else {
        setVisibleMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === currentMessage.id);
          if (exists) return prev;
          return [...prev, currentMessage];
        });
        messageIndex++;
      }
    };

    // Start the first message
    addNextMessage();
    
    const interval = setInterval(() => {
      addNextMessage();
    }, 3000); // Add new message every 3 seconds

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (isLooping) {
      const cleanup = startChatLoop();
      return cleanup;
    }
  }, [isLooping]);

  return (
    <section id="mobile-showcase" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Mobile Phone Mockup */}
          <div className="flex justify-center lg:justify-start">
            <div className={`relative transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-16 opacity-0'}`}>
              {/* Phone Frame */}
              <div className="w-80 h-[640px] bg-gradient-to-b from-gray-800 to-black rounded-[3rem] p-2 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                  
                  {/* Status Bar */}
                  <div className="absolute top-6 left-0 right-0 px-6 py-2 flex justify-between items-center text-xs font-medium z-10">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                      <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                      <div className="w-4 h-2 bg-gray-300 rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* App Interface */}
                  <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50 pt-16 px-4">
                    {/* App Header */}
                    <div className="bg-white rounded-t-2xl px-4 py-3 shadow-sm border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-gray-900">Live Project</h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">
                            {isLooping ? 'Live Chat' : 'Online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Container */}
                    <div className="bg-white h-full rounded-b-2xl p-4 flex flex-col">
                      {/* Messages Display (WhatsApp Style) */}
                      <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Show all visible messages */}
                        {visibleMessages.map((message, index) => (
                          <div key={message.id} className="transform transition-all duration-500 ease-in-out">
                            {message.type === 'designer' ? (
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-white">{message.avatar}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                                    <div className="text-xs font-medium text-gray-800 mb-1">{message.name}</div>
                                    <div className="text-sm text-gray-700">{message.message}</div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 ml-2">{message.time}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-end justify-end">
                                <div className="flex-1 flex justify-end">
                                  <div className="bg-green-500 rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                                    <div className="text-sm text-white">{message.message}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {message.type === 'customer' && (
                              <div className="text-xs text-gray-500 mt-1 mr-2 text-right">{message.time}</div>
                            )}
                          </div>
                        ))}

                        {/* Show typing indicator if active */}
                        {showTyping && (
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">S</span>
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                Sarah Designer is typing...
                              </div>
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center space-x-3 mt-4">
                        <div className="flex-1 bg-white rounded-full px-4 py-2">
                          <span className="text-sm text-gray-400">Type a message...</span>
                        </div>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-white text-lg">🔔</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-white text-sm">💬</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:pl-8">
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 leading-tight">
                Connecting Designers & 
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Customers</span> in Real Time
              </h2>
            </div>

            <div className="space-y-8">
              {/* For Customers */}
              <div className={`transform transition-all duration-800 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                <div className="flex group hover:translate-x-2 transition-transform duration-300">
                  <div className="w-1 bg-gradient-to-b from-green-400 to-green-600 rounded-full mr-6 flex-shrink-0 group-hover:w-2 transition-all duration-300"></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <span className="text-green-500 mr-2">❤️</span>
                      For Customers
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      We offer instant access to real designers, enabling live collaboration and faster turnaround for all your creative needs.
                    </p>
                  </div>
                </div>
              </div>

              {/* For Designers */}
              <div className={`transform transition-all duration-800 delay-700 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
                <div className="flex group hover:translate-x-2 transition-transform duration-300">
                  <div className="w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full mr-6 flex-shrink-0 group-hover:w-2 transition-all duration-300"></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <span className="text-blue-500 mr-2">🎨</span>
                      For Designers
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      Designers receive real-time project requests and can collaborate instantly, helping them grow their income directly through the app.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Link to="/designers">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 whitespace-nowrap">
                    <span className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative flex items-center justify-center">
                      <Search className="w-5 h-5 mr-2" />
                      Explore Designers
                    </span>
                  </button>
                </Link>
                
                <Link to="/signup?role=designer">
                  <button className="group relative px-8 py-4 bg-white border-2 border-blue-500 text-blue-600 font-semibold rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 whitespace-nowrap">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative flex items-center justify-center group-hover:text-white transition-colors duration-300">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Join as Designer
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileShowcase;
