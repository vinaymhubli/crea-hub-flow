import { useState } from 'react';
import { Play, Pause, Square, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SessionControlsProps {
  duration: number; // in seconds
  isPaused: boolean;
  isLive: boolean;
  participantName: string;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  sessionId: string;
}

export default function SessionControls({
  duration,
  isPaused,
  isLive,
  participantName,
  onPause,
  onResume,
  onEnd,
  sessionId
}: SessionControlsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-white/50 shadow-lg">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Live/Paused indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isPaused ? 'bg-yellow-500' : 
                isLive ? 'bg-red-500 animate-pulse' : 
                'bg-gray-400'
              }`} />
              <Badge 
                variant={isPaused ? "secondary" : isLive ? "destructive" : "outline"}
                className={`text-xs ${
                  isPaused ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  isLive ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {isPaused ? 'Paused' : isLive ? 'Live' : 'Ended'}
              </Badge>
            </div>

            {/* Session duration */}
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className="font-mono text-sm sm:text-lg font-semibold text-gray-900">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Participant info */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="truncate">with {participantName}</span>
          </div>
        </div>

        {/* Session info bar */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm gap-1 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-0">
              <span className="text-gray-500">Session ID: </span>
              <span className="font-mono text-gray-700 text-xs sm:text-sm break-all sm:break-normal">{sessionId}</span>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              <span className="hidden sm:inline">Design Session in Progress</span>
              <span className="sm:hidden">Session Active</span>
            </div>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-3">
          {/* Pause/Resume button */}
          <Button
            onClick={isPaused ? onResume : onPause}
            variant={isPaused ? "default" : "secondary"}
            size="lg"
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${
              isPaused 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            disabled={!isLive}
          >
            {isPaused ? (
              <Play className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5 sm:ml-1" />
            ) : (
              <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
            )}
          </Button>

          {/* End session button */}
          <Button
            onClick={onEnd}
            variant="destructive"
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700"
          >
            <Square className="w-4 h-4 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Button labels */}
        <div className="flex items-center justify-center space-x-6 sm:space-x-8 mt-2">
          <span className="text-xs text-gray-500">
            {isPaused ? 'Resume' : 'Pause'}
          </span>
          <span className="text-xs text-gray-500">
            End Session
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
