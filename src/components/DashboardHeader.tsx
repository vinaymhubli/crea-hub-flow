import React from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, ChevronRight, Home } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  avatarImage?: string;
  userInitials?: string;
  rating?: number;
  isOnline?: boolean;
  showPublicProfile?: boolean;
  publicProfileLink?: string;
  showHomeButton?: boolean;
  additionalInfo?: React.ReactNode;
  actionButton?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  icon,
  avatarImage,
  userInitials,
  rating,
  isOnline,
  showPublicProfile = false,
  publicProfileLink,
  showHomeButton = false,
  additionalInfo,
  actionButton
}: DashboardHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 px-4 sm:px-6 py-4 sm:py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <SidebarTrigger className="text-white hover:bg-white/20 rounded-lg p-2 flex-shrink-0" />
          {showHomeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="text-white hover:bg-white/20 flex items-center space-x-2 text-xs sm:text-sm"
            >
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          )}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            {avatarImage ? (
              <img 
                src={avatarImage} 
                alt="Profile" 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-white/30 shadow-xl flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
                {icon || (
                  <span className="text-white font-bold text-base sm:text-xl">
                    {userInitials || 'U'}
                  </span>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{title}</h1>
              {subtitle && (
                <p className="text-white/90 text-xs sm:text-sm lg:text-lg truncate">
                  {subtitle}
                </p>
              )}
              <div className="flex items-center space-x-2 sm:space-x-4 mt-1 sm:mt-2">
                {rating !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-300 text-yellow-300" />
                    <span className="text-white/90 font-medium text-xs sm:text-sm">{rating.toFixed(1)}</span>
                  </div>
                )}
                {isOnline !== undefined && (
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {isOnline ? 'Available' : 'Offline'}
                  </Badge>
                )}
                {additionalInfo}
              </div>
            </div>
          </div>
        </div>
        {showPublicProfile && publicProfileLink && (
          <Button 
            asChild 
            className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            <Link to={publicProfileLink} state={{ hideGlobalChrome: true, fromProfile: true }}>
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Public Profile</span>
              <span className="sm:hidden">View Public</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </Button>
        )}
        {actionButton}
      </div>
    </header>
  );
}
