import { useEffect, useState } from 'react';
import { Clock, Activity } from 'lucide-react';

interface LiveSessionTickerProps {
  isLive: boolean;
  duration: number; // in seconds
  participantName: string;
  sessionId: string;
}

export default function LiveSessionTicker({
  isLive,
  duration,
  participantName,
  sessionId
}: LiveSessionTickerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLive) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-4 animate-pulse">
        {/* Live indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-ping" />
          <span className="font-semibold text-sm uppercase tracking-wide">
            LIVE
          </span>
        </div>

        {/* Session duration */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg font-bold">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Session info */}
        <div className="flex items-center space-x-2 border-l border-white/30 pl-4">
          <Activity className="w-4 h-4" />
          <span className="text-sm">
            Design Session with {participantName}
          </span>
        </div>

        {/* Current time */}
        <div className="text-sm border-l border-white/30 pl-4">
          {currentTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Session ID badge */}
      <div className="mt-2 text-center">
        <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full font-mono">
          ID: {sessionId.substring(0, 8)}...
        </span>
      </div>
    </div>
  );
}
