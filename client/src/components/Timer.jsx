import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { updateStudyTime } from '../features/analytics/analyticsSlice';

function Timer({ initialMinutes = 25, onComplete }) {
  const dispatch = useDispatch();
  
  // Initialize state from localStorage or use default values
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('studyTimer_timeLeft');
    return saved ? parseInt(saved) : initialMinutes * 60;
  });
  
  const [isRunning, setIsRunning] = useState(() => {
    return localStorage.getItem('studyTimer_isRunning') === 'true';
  });
  
  const [customMinutes, setCustomMinutes] = useState(() => {
    const saved = localStorage.getItem('studyTimer_customMinutes');
    return saved ? parseInt(saved) : initialMinutes;
  });
  
  const [isSettingTime, setIsSettingTime] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Load accumulated time from localStorage
  const accumulatedTimeRef = useRef(
    localStorage.getItem('studyTimer_accumulatedTime') 
      ? parseInt(localStorage.getItem('studyTimer_accumulatedTime')) 
      : 0
  );
  
  // Time of last db sync to prevent too frequent updates
  const lastSyncTimeRef = useRef(
    localStorage.getItem('studyTimer_lastSyncTime')
      ? parseInt(localStorage.getItem('studyTimer_lastSyncTime'))
      : 0
  );
  
  // Handle initial load of the component
  useEffect(() => {
    // If timer was running when the page was last closed/refreshed
    if (isRunning) {
      const savedStartTime = localStorage.getItem('studyTimer_startTime');
      if (savedStartTime) {
        const storedStartTime = parseInt(savedStartTime);
        startTimeRef.current = storedStartTime;
        
        // Calculate elapsed time since the timer was started and adjust timeLeft
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - storedStartTime) / 1000);
        
        // If more time has elapsed than was left on the timer
        if (elapsedSeconds >= timeLeft) {
          // Timer should have completed while away
          setIsRunning(false);
          setTimeLeft(0);
          
          // Calculate study time that happened while away
          const totalSeconds = accumulatedTimeRef.current + timeLeft;
          const totalMinutes = Math.round(totalSeconds / 60);
          
          if (totalMinutes > 0) {
            // Sync the study time to the database
            const today = new Date().toISOString().split('T')[0];
            dispatch(updateStudyTime({ minutes: totalMinutes, date: today }));
            
            // Reset accumulated time
            accumulatedTimeRef.current = 0;
            localStorage.setItem('studyTimer_accumulatedTime', 0);
            localStorage.removeItem('studyTimer_startTime');
            
            if (onComplete) onComplete(totalMinutes);
          }
        } else {
          // Timer still has time left
          setTimeLeft(prevTime => prevTime - elapsedSeconds);
        }
      } else {
        // No start time saved but timer is running, reset the state
        startTimeRef.current = Date.now();
        localStorage.setItem('studyTimer_startTime', startTimeRef.current);
      }
    }
    
    // Clean up function to handle page navigation/refresh
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studyTimer_timeLeft', timeLeft);
    localStorage.setItem('studyTimer_isRunning', isRunning);
    localStorage.setItem('studyTimer_customMinutes', customMinutes);
    localStorage.setItem('studyTimer_accumulatedTime', accumulatedTimeRef.current);
    
    if (startTimeRef.current) {
      localStorage.setItem('studyTimer_startTime', startTimeRef.current);
    }
  }, [timeLeft, isRunning, customMinutes]);

  // Sync study time to database when accumulating significant time (1+ minute)
  const syncToDatabase = (minutes) => {
    if (minutes <= 0) return;
    
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    // Only sync if we have a meaningful amount of time (at least 1 minute)
    // and it's been at least 1 minute since the last sync
    if (minutes >= 1 && (now - lastSyncTimeRef.current >= 60 * 1000)) {
      // Debug log
      console.log(`Syncing ${minutes} minutes to database for ${today}`);
      
      dispatch(updateStudyTime({ minutes, date: today }));
      lastSyncTimeRef.current = now;
      localStorage.setItem('studyTimer_lastSyncTime', now);
      
      // Reset accumulated time after syncing to database
      accumulatedTimeRef.current = 0;
      localStorage.setItem('studyTimer_accumulatedTime', 0);
      
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Record start time when timer begins
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        localStorage.setItem('studyTimer_startTime', startTimeRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            
            // Calculate actual time spent
            const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const totalMinutes = Math.round((accumulatedTimeRef.current + elapsedSeconds) / 60);
            
            // Reset tracking refs
            startTimeRef.current = null;
            accumulatedTimeRef.current = 0;
            
            // Clear localStorage timer data
            localStorage.removeItem('studyTimer_startTime');
            localStorage.setItem('studyTimer_accumulatedTime', 0);
            
            // Sync to database
            syncToDatabase(totalMinutes);
            
            // Call the completion callback with actual minutes studied
            if (onComplete) onComplete(totalMinutes);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      
      // If paused, accumulate the time spent so far
      if (startTimeRef.current !== null) {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedTimeRef.current += elapsedSeconds;
        localStorage.setItem('studyTimer_accumulatedTime', accumulatedTimeRef.current);
        
        // If accumulated enough time (1+ minute), sync to database
        const accumulatedMinutes = Math.floor(accumulatedTimeRef.current / 60);
        if (accumulatedMinutes >= 1) {
          // Only reset accumulated time if sync is successful
          if (syncToDatabase(accumulatedMinutes)) {
            accumulatedTimeRef.current = accumulatedTimeRef.current % 60; // Keep remaining seconds
            localStorage.setItem('studyTimer_accumulatedTime', accumulatedTimeRef.current);
          }
        }
        
        startTimeRef.current = null;
        localStorage.removeItem('studyTimer_startTime');
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        
        // If unmounting while the timer is running, save the accumulated time
        if (isRunning && startTimeRef.current) {
          const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
          accumulatedTimeRef.current += elapsedSeconds;
          localStorage.setItem('studyTimer_accumulatedTime', accumulatedTimeRef.current);
          
          // If accumulated enough time (1+ minute), sync to database
          const accumulatedMinutes = Math.floor(accumulatedTimeRef.current / 60);
          if (accumulatedMinutes >= 1) {
            syncToDatabase(accumulatedMinutes);
          }
        }
      }
    };
  }, [isRunning, onComplete, dispatch]);

  const toggleTimer = () => {
    // If starting the timer, record current timestamp
    if (!isRunning) {
      startTimeRef.current = Date.now();
      localStorage.setItem('studyTimer_startTime', startTimeRef.current);
    } else {
      // If stopping, calculate and store elapsed time
      if (startTimeRef.current) {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedTimeRef.current += elapsedSeconds;
        localStorage.setItem('studyTimer_accumulatedTime', accumulatedTimeRef.current);
        
        startTimeRef.current = null;
        localStorage.removeItem('studyTimer_startTime');
      }
    }
    
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customMinutes * 60);
    
    // If there's accumulated time, sync it to the database before resetting
    const accumulatedMinutes = Math.floor(accumulatedTimeRef.current / 60);
    if (accumulatedMinutes >= 1) {
      syncToDatabase(accumulatedMinutes);
    }
    
    // Reset tracking refs
    startTimeRef.current = null;
    accumulatedTimeRef.current = 0;
    
    // Clear localStorage timer data
    localStorage.removeItem('studyTimer_startTime');
    localStorage.setItem('studyTimer_accumulatedTime', 0);
  };

  const handleMinutesChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setCustomMinutes(value);
    }
  };

  const applyCustomTime = () => {
    setTimeLeft(customMinutes * 60);
    setIsSettingTime(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-component inline-flex items-center space-x-2 p-4 rounded-lg">
      {isSettingTime ? (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="120"
            value={customMinutes}
            onChange={handleMinutesChange}
            className="w-16 text-center border border-gray-300 rounded-md p-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={applyCustomTime}
            className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-800 transition-all duration-200 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <div 
            onClick={() => setIsSettingTime(true)}
            className={`timer-display font-mono text-lg cursor-pointer px-3 py-2 rounded-md ${isRunning ? 'bg-indigo-50 text-indigo-700 border-indigo-200 border animate-pulse' : 'hover:bg-gray-100 border border-gray-200'}`}
            data-minutes={customMinutes}
          >
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={toggleTimer}
            className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-all duration-200 transform hover:scale-110"
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 transform hover:scale-110"
            aria-label="Reset timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

Timer.propTypes = {
  initialMinutes: PropTypes.number,
  onComplete: PropTypes.func
};

export default Timer; 