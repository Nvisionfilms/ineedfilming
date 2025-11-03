import { useEffect, useState } from "react";

interface CountdownTimerProps {
  onExpire?: () => void;
}

const CountdownTimer = ({ onExpire }: CountdownTimerProps) => {
  const STORAGE_KEY = "nvision_countdown_v2";
  
  const getOrSetStartDate = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const now = new Date();
    
    if (stored) {
      const storedDate = new Date(stored);
      // If it's a new month, reset the countdown
      if (storedDate.getMonth() !== now.getMonth() || storedDate.getFullYear() !== now.getFullYear()) {
        localStorage.setItem(STORAGE_KEY, now.toISOString());
        return now;
      }
      return storedDate;
    }
    
    // First time or no stored date - start fresh today
    localStorage.setItem(STORAGE_KEY, now.toISOString());
    return now;
  };

  const calculateTimeLeft = () => {
    const startDate = getOrSetStartDate();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    
    const difference = endDate.getTime() - new Date().getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.expired && !timeLeft.expired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft.expired]);

  return (
    <div className="flex gap-4 justify-center items-center">
      {Object.entries(timeLeft)
        .filter(([unit]) => unit !== 'expired')
        .map(([unit, value]) => (
          <div key={unit} className="flex flex-col items-center animate-pulse">
            <div className="bg-destructive/20 border-2 border-destructive rounded-lg px-4 py-2 min-w-[70px] shadow-lg shadow-destructive/20">
              <span className="text-2xl md:text-3xl font-bold text-destructive">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs text-destructive/80 mt-1 capitalize font-semibold">{unit}</span>
          </div>
        ))}
    </div>
  );
};

export default CountdownTimer;
