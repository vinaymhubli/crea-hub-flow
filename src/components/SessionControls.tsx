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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Live/Paused indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
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
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-mono text-lg font-semibold text-gray-900">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Participant info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>with {participantName}</span>
          </div>
        </div>

        {/* Session info bar */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-500">Session ID: </span>
              <span className="font-mono text-gray-700">{sessionId}</span>
            </div>
            <div className="text-gray-500">
              Design Session in Progress
            </div>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-3">
          {/* Pause/Resume button */}
          <Button
            onClick={isPaused ? onResume : onPause}
            variant={isPaused ? "default" : "secondary"}
            size="lg"
            className={`w-14 h-14 rounded-full ${
              isPaused 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
            disabled={!isLive}
          >
            {isPaused ? (
              <Play className="w-6 h-6 ml-1" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </Button>

          {/* End session button */}
          <Button
            onClick={onEnd}
            variant="destructive"
            size="lg"
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
          >
            <Square className="w-6 h-6" />
          </Button>
        </div>

        {/* Button labels */}
        <div className="flex items-center justify-center space-x-8 mt-2">
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
