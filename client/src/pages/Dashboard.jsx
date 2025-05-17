import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import { getTasks } from "../features/tasks/taskSlice";
import {
  getUserAnalytics,
  updateStudyTime,
} from "../features/analytics/analyticsSlice";
import Timer from "../components/Timer";
import FeedbackForm from "../components/FeedbackForm";

// CSS for animations and dashboard styles
const dashboardStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.8s ease-in-out forwards;
  }

  .animate-fade-in-down {
    animation: fadeInDown 0.8s ease-out forwards;
  }

  .animate-float {
    animation: float 3s infinite ease-in-out;
  }

  .animate-pulse {
    animation: pulse 2s infinite;
  }

  .chart-point:hover {
    r: 6;
    transition: all 0.3s ease;
  }

  .chart-tooltip {
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  /* Add glass morphism effect */
  .glass-card {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
`;

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { tasks } = useSelector((state) => state.tasks);
  const { analytics } = useSelector((state) => state.analytics);

  const [studyTime, setStudyTime] = useState(0);
  const [studyHistory, setStudyHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    total: 0,
    rate: 0,
  });
  const [dailyStudyTime, setDailyStudyTime] = useState([]);
  const [dataMigrated, setDataMigrated] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(getTasks());
      dispatch(getUserAnalytics());
    }
  }, [user, navigate, dispatch]);

  // Set up a refresh interval to update analytics data every 2 hours
  useEffect(() => {
    // Initial data fetch
    dispatch(getUserAnalytics());
    
    // Set up an interval to refresh data every 2 hours (7,200,000 ms)
    const refreshInterval = setInterval(() => {
      dispatch(getUserAnalytics());
      console.log('Analytics data refreshed automatically');
    }, 2 * 60 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [dispatch]);

  // Migrate localStorage data to the backend once
  useEffect(() => {
    if (user && analytics && !dataMigrated) {
      migrateLocalStorageData();
    }
  }, [user, analytics, dataMigrated, dispatch]);

  // Update local state when analytics data is loaded
  useEffect(() => {
    if (analytics) {
      setStudyTime(analytics.totalStudyTime);
      setStudyHistory(analytics.studyHistory || []);
      setStreak(analytics.currentStreak);
      setLongestStreak(analytics.longestStreak);

      // Generate data for the past 30 days
      const generatePastMonthData = () => {
        const today = new Date();
        const pastMonth = [];
        
        // Create entries for the past 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Find if there's study data for this date
          const dayData = analytics.studyHistory?.find(day => day.date === dateStr);
          
          // Add the data point (with 0 minutes if no activity)
          pastMonth.push({
            date: dateStr,
            minutes: dayData ? dayData.minutes : 0
          });
        }
        
        return pastMonth;
      };
      
      // Set the daily study time with all days included
      setDailyStudyTime(generatePastMonthData());
    }
  }, [analytics]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const completed = tasks?.filter?.((task) => task.status === "completed").length;
      setTaskStats({
        completed,
        total: tasks.length,
        rate: Math.round((completed / tasks.length) * 100),
      });
    }
  }, [tasks]);

  // Function to migrate localStorage data to the backend
  const migrateLocalStorageData = () => {
    // Only migrate if we have localStorage data and backend analytics is empty
    const savedHistory = localStorage.getItem("studyHistory");
    const savedTime = localStorage.getItem("totalStudyTime");

    if (
      (savedHistory || savedTime) &&
      analytics &&
      (!analytics.studyHistory || analytics.studyHistory.length === 0)
    ) {
      console.log("Migrating analytics data from localStorage to backend...");

      // Process study history
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);

          // For each day in history, update the backend
          parsedHistory.forEach((day) => {
            dispatch(
              updateStudyTime({
                minutes: day.minutes,
                date: day.date,
              })
            );
          });

          // Clean up localStorage after migration
          localStorage.removeItem("studyHistory");
          localStorage.removeItem("totalStudyTime");

          console.log("Analytics data migration complete");
        } catch (error) {
          console.error("Failed to migrate analytics data:", error);
        }
      }
    }

    setDataMigrated(true);
  };

  const handleTimerComplete = (minutes) => {
    if (!minutes || minutes <= 0) return;
    
    console.log(`Timer completed with ${minutes} minutes tracked`);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Update study time with API and refresh analytics data
    dispatch(updateStudyTime({ minutes, date: today }))
      .unwrap()
      .then((updatedAnalytics) => {
        // Success - update local state with the new analytics data
        setStudyTime(updatedAnalytics.totalStudyTime);
        setStudyHistory(updatedAnalytics.studyHistory || []);
        setStreak(updatedAnalytics.currentStreak);
        setLongestStreak(updatedAnalytics.longestStreak);
        
        // Regenerate daily study time data to update the chart
        const generatePastMonthData = () => {
          const today = new Date();
          const pastMonth = [];
          
          // Create entries for the past 30 days
          for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Find if there's study data for this date
            const dayData = updatedAnalytics.studyHistory?.find(day => day.date === dateStr);
            
            // Add the data point (with 0 minutes if no activity)
            pastMonth.push({
              date: dateStr,
              minutes: dayData ? dayData.minutes : 0
            });
          }
          
          return pastMonth;
        };
        
        // Update chart data
        setDailyStudyTime(generatePastMonthData());
        
        // Show success notification instead of alert
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg';
        notification.style.zIndex = '9999';
        notification.innerHTML = `
          <div class="flex items-center">
            <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <p>Great job! You've studied for ${minutes} minutes.</p>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 4 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.5s ease-in-out';
          setTimeout(() => document.body.removeChild(notification), 500);
        }, 4000);
      })
      .catch((error) => {
        console.error("Error updating study time:", error);
        // Show error message
        alert("Failed to update study time. Please try again.");
        
        // Refresh analytics data to ensure consistency
        dispatch(getUserAnalytics());
      });
  };

  const formatStudyTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d");
    } catch (error) {
      return dateString;
    }
  };

  const startTodaysSession = () => {
    navigate("/tasks");
  };

  // Get today's study time
  const todayStudyTime =
    studyHistory.find(
      (day) => day.date === new Date().toISOString().split("T")[0]
    )?.minutes || 0;

  // Apply styles to head on component mount
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = dashboardStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="space-y-8 pb-10" style={{
      background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)",
      backgroundImage: "radial-gradient(#e0e7ff 1px, transparent 1px), radial-gradient(#e0e7ff 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 10px 10px",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      {/* Custom scrollbar style */}
      <style jsx="true">{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #818cf8;
        }
      `}</style>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-8 mb-8 transform transition-all duration-300 hover:shadow-xl animate-fade-in-down">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4 animate-fade-in">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-lg opacity-90 mb-6 animate-fade-in" style={{animationDelay: "0.2s"}}>
              "Success is not final, failure is not fatal: it is the courage to
              continue that counts."
            </p>
            <button
              className="bg-white text-indigo-600 rounded-full px-8 py-3 text-base font-medium inline-flex items-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in"
              onClick={startTodaysSession}
              style={{animationDelay: "0.4s"}}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Start Today's Session
            </button>
          </div>
          <div className="hidden lg:block transform transition-all duration-500 hover:scale-105 animate-float">
            <svg
              width="250"
              height="250"
              viewBox="0 0 2050 2050"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>{`
      .cls-1{fill:#4d4c78;}
      .cls-11,.cls-2{fill:#323150;}
      .cls-3{fill:#67baeb;}
      .cls-4{fill:#f44533;}
      .cls-5{fill:#de3226;}
      .cls-6{fill:#f4c23f;}
      .cls-7{fill:#f4a93f;}
      .cls-8{fill:#c8c2e9;}
      .cls-9{fill:#b9b1e0;}
      .cls-10{fill:#b11a31;}
      .cls-11{opacity:0.1;}
      .cls-12{fill:#83d0fb;}
      .cls-13{opacity:0.2;}
      .cls-14{fill:#ffffff;}
      .cls-15{fill:#231f20;}
      .cls-16{fill:#fad564;}
      .cls-17{fill:#dfdafd;}
      .cls-18{fill:#f46253;}
    `}</style>
              </defs>

              <rect
                className="cls-1"
                height="120.02"
                rx="60"
                ry="60"
                width="1911.2"
                x="69.4"
                y="1589.3"
              />
              <path
                className="cls-2"
                d="M1920.6,1589.3H154.9c-.1,1.3-.1,2.6-.1,3.9h0a60,60,0,0,0,60,60.1H1980.4c.1-1.4.2-2.7.2-4h0A60,60,0,0,0,1920.6,1589.3Z"
              />
              <rect
                className="cls-3"
                height="1158.16"
                transform="translate(-147.9 290.1) rotate(-10)"
                width="273.3"
                x="1440.7"
                y="408"
              />
              <rect
                className="cls-3"
                height="1252.55"
                width="295.6"
                x="237.1"
                y="340.7"
              />
              <rect
                className="cls-4"
                height="1252.55"
                width="295.6"
                x="1017.2"
                y="340.7"
              />
              <polygon
                className="cls-5"
                points="1017.2 1593.2 1312.8 1593.2 1312.8 340.7 1262.8 340.7 1262.8 1536.4 1017.2 1536.4 1017.2 1593.2"
              />
              <rect
                className="cls-6"
                height="1166.42"
                width="242.6"
                x="532.7"
                y="426.8"
              />
              <path
                className="cls-7"
                d="M711.9,426.8V1371c0,98.9-80.2,179.2-179.2,179.2h0v43H775.3V426.8Z"
              />
              <rect
                className="cls-8"
                height="1089.46"
                width="242.6"
                x="774.6"
                y="503.8"
              />
              <path
                className="cls-9"
                d="M970.7,503.8v854.9c0,108.3-87.8,196.1-196.1,196.1h0v38.4h242.6V503.8Z"
              />
              <rect
                className="cls-1"
                height="87.09"
                width="295.6"
                x="237.1"
                y="538.2"
              />
              <rect
                className="cls-1"
                height="87.09"
                width="295.6"
                x="237.1"
                y="1308.7"
              />
              <rect
                className="cls-7"
                height="847.15"
                width="60.7"
                x="618.1"
                y="600.4"
              />
              <path
                className="cls-1"
                d="M950.7,678.9H841.1a20,20,0,0,1,0-40H950.7a20,20,0,0,1,0,40Z"
              />
              <path
                className="cls-1"
                d="M950.7,780.2H841.1a20,20,0,0,1,0-40H950.7a20,20,0,0,1,0,40Z"
              />
              <path
                className="cls-1"
                d="M950.7,881.4H841.1a20,20,0,0,1,0-40H950.7a20,20,0,0,1,0,40Z"
              />
              <path
                className="cls-1"
                d="M931.9,1488.6h-72a20,20,0,0,1,0-40h72a20,20,0,1,1,0,40Z"
              />
              <path
                className="cls-10"
                d="M1110.3,1401.7a20.1,20.1,0,0,1-20-20V552.3a20,20,0,0,1,40,0v829.4A20,20,0,0,1,1110.3,1401.7Z"
              />
              <path
                className="cls-10"
                d="M1219.6,1401.7a20,20,0,0,1-20-20V552.3a20,20,0,0,1,40,0v829.4A20.1,20.1,0,0,1,1219.6,1401.7Z"
              />
              <polygon
                className="cls-1"
                points="1786.1 1382.3 1786.1 1382.3 1517 1430 1524 1469.4 1793.1 1421.7 1786.1 1382.3"
              />
              <rect
                className="cls-1"
                height="40"
                transform="translate(-72.6 269.8) rotate(-10)"
                width="273.3"
                x="1363"
                y="528.3"
              />
              <polygon
                className="cls-1"
                points="1682.1 794.6 1682.1 794.6 1675.1 755.3 1675.1 755.3 1406 802.9 1406 802.9 1413 842.3 1413 842.3 1682.1 794.6"
              />
              <polygon
                className="cls-1"
                points="1748.8 1171.2 1741.8 1131.8 1472.6 1179.5 1479.6 1218.9 1479.6 1218.9 1748.8 1171.2"
              />
              <path
                className="cls-11"
                d="M447.3,1319.3V340.7h85.4V1593.2H237.1v-63.7h0C353.2,1529.5,447.3,1435.4,447.3,1319.3Z"
              />
              <path
                className="cls-11"
                d="M1611,393l-68.5,12.2L1701.2,1302c18.8,106-51.9,207.2-158,225.9l-8.6,1.6,9.1,51.6,269.2-47.6Z"
              />
              <rect
                className="cls-12"
                height="524.76"
                rx="32.4"
                ry="32.4"
                width="64.8"
                x="237.1"
                y="720.7"
              />
              <g className="cls-13">
                <rect
                  className="cls-14"
                  height="584.09"
                  rx="36.1"
                  ry="36.1"
                  transform="translate(-143.8 271.3) rotate(-10)"
                  width="72.2"
                  x="1436.6"
                  y="662.2"
                />
                <path
                  className="cls-15"
                  d="M1517.2,1242.9a36.6,36.6,0,0,1-36-30.3L1392,708.5a36.6,36.6,0,0,1,29.6-42.4,36.7,36.7,0,0,1,42.5,29.7l89.2,504.1a36.6,36.6,0,0,1-29.6,42.4v0A35.7,35.7,0,0,1,1517.2,1242.9Z"
                />
              </g>
              <rect
                className="cls-12"
                height="133.95"
                rx="32.4"
                ry="32.4"
                width="64.8"
                x="237.1"
                y="370.8"
              />
              <rect
                className="cls-16"
                height="586.49"
                rx="24.3"
                ry="24.3"
                width="48.6"
                x="532.7"
                y="446.9"
              />
              <rect
                className="cls-17"
                height="331.71"
                rx="23.2"
                ry="23.2"
                width="46.5"
                x="774.6"
                y="947.6"
              />
              <rect
                className="cls-17"
                height="57.13"
                rx="19.2"
                ry="19.2"
                width="121.3"
                x="774.6"
                y="503.8"
              />
              <rect
                className="cls-18"
                height="755.16"
                rx="19.4"
                ry="19.4"
                width="38.9"
                x="1017.2"
                y="503.8"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Notes */}
        <Link
          to="/notes"
          className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-indigo-500"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Notes
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transform transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Create, edit and organize your notes with AI assistance.
            </p>
            <div className="flex justify-end">
              <span className="text-indigo-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1">
                View Notes 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Flashcards */}
        <Link
          to="/flashcards"
          className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-purple-500"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Flashcards
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 transform transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Create and study flashcards with spaced repetition.
            </p>
            <div className="flex justify-end">
              <span className="text-purple-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1">
                View Flashcards
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Tasks */}
        <Link
          to="/tasks"
          className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-green-500"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tasks & To-Do
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600 transform transition-all duration-300 group-hover:bg-green-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Manage your study schedule and track your progress.
            </p>
            <div className="flex justify-end">
              <span className="text-green-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1">
                View Tasks
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Take Notes */}
        <Link
          to="/paint"
          className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-pink-500"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Take Notes
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 transform transition-all duration-300 group-hover:bg-pink-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Draw diagrams, create sketches, and take handwritten notes.
            </p>
            <div className="flex justify-end">
              <span className="text-pink-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1">
                Open Canvas
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* AI Chatbot */}
        <Link
          to="/chatbot"
          className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-blue-500"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Chatbot
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 transform transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Chat with an AI assistant to help with your studies and questions.
            </p>
            <div className="flex justify-end">
              <span className="text-blue-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1">
                Start Chatting
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </Link>

        {/* Feedback Card */}
        <div className="group bg-white rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-l-4 border-amber-500">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Give Feedback
              </h2>
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 transform transition-all duration-300 group-hover:bg-amber-600 group-hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Share your thoughts and help us improve the platform for everyone.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => document.getElementById('feedback-section').scrollIntoView({ behavior: 'smooth' })}
                className="text-amber-600 text-sm font-medium flex items-center transform transition-all duration-300 group-hover:translate-x-1"
              >
                Submit Feedback
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Analytics
            </h2>
          </div>
          <div className="text-sm font-medium bg-green-100 text-green-800 px-4 py-2 rounded-full shadow-sm flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 10.586V6z" clipRule="evenodd" />
            </svg>
            <span className="font-bold">Today:</span>{" "}
            <span className="ml-1">{todayStudyTime} minutes studied</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-xl p-6 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500 opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
            
            <svg className="w-8 h-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Study Time
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatStudyTime(studyTime)}
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0 1 1 0 002 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Lifetime tracked study time
            </p>
          </div>
          
          <div 
            className="bg-white rounded-xl p-6 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-500 opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
            
            <svg className="w-8 h-8 text-green-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Streak
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {streak} {streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Consecutive study days
            </p>
          </div>
          
          <div 
            className="bg-white rounded-xl p-6 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-yellow-500 opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
            
            <svg className="w-8 h-8 text-yellow-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Longest Streak
            </h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Best study consistency
            </p>
          </div>
          
          <div 
            className="bg-white rounded-xl p-6 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500 opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
            
            <svg className="w-8 h-8 text-purple-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tasks Completed
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {taskStats.completed}/{taskStats.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-2">
              <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${taskStats.rate}%` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {taskStats.rate}% completion rate
            </p>
          </div>
        </div>

        {/* Daily Study Chart */}
        <div className="mt-8">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Daily Study Time (Last 30 Days)
            </h3>
          </div>
          <div className="w-full h-72 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 chart-container">
            {dailyStudyTime.length > 0 ? (
              <div className="relative h-60 w-full">
                {/* Line Graph */}
                <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                  {/* Define gradients */}
                  <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* Y-axis grid lines */}
                  <line x1="40" y1="0" x2="40" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="40" y1="0" x2="700" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="40" y1="36" x2="700" y2="36" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="40" y1="72" x2="700" y2="72" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="40" y1="108" x2="700" y2="108" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="40" y1="144" x2="700" y2="144" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                  <line x1="40" y1="180" x2="700" y2="180" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Y-axis labels */}
                  <text x="30" y="5" textAnchor="end" fontSize="10" fill="#6b7280">480m</text>
                  <text x="30" y="40" textAnchor="end" fontSize="10" fill="#6b7280">384m</text>
                  <text x="30" y="76" textAnchor="end" fontSize="10" fill="#6b7280">288m</text>
                  <text x="30" y="112" textAnchor="end" fontSize="10" fill="#6b7280">192m</text>
                  <text x="30" y="148" textAnchor="end" fontSize="10" fill="#6b7280">96m</text>
                  <text x="30" y="185" textAnchor="end" fontSize="10" fill="#6b7280">0m</text>
                  
                  {/* Area beneath the line */}
                  <polygon
                    points={`40,180 ${dailyStudyTime.map((day, index) => {
                      const xPos = 40 + ((700 - 40) / (dailyStudyTime.length - 1 || 1)) * index;
                      const yPos = 180 - (day.minutes / 480) * 180;
                      return `${xPos},${yPos}`;
                    }).join(' ')} ${40 + ((700 - 40) / (dailyStudyTime.length - 1 || 1)) * (dailyStudyTime.length - 1)},180`}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Line for the study minutes */}
                  <polyline
                    points={dailyStudyTime.map((day, index) => {
                      const xPos = 40 + ((700 - 40) / (dailyStudyTime.length - 1 || 1)) * index;
                      const yPos = 180 - (day.minutes / 480) * 180;
                      return `${xPos},${yPos}`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#line-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points with tooltips */}
                  {dailyStudyTime.map((day, index) => {
                    const xPos = 40 + ((700 - 40) / (dailyStudyTime.length - 1 || 1)) * index;
                    const yPos = 180 - (day.minutes / 480) * 180;
                    return (
                      <g key={index} className="chart-point-group">
                        {/* Only show data points for days with activity */}
                        {day.minutes > 0 && (
                          <circle 
                            cx={xPos} 
                            cy={yPos} 
                            r="4" 
                            fill="#8b5cf6" 
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="chart-point"
                          />
                        )}
                        
                        {/* Data value tooltip */}
                        <g className="chart-tooltip" style={{ opacity: 0 }}>
                          <rect
                            x={xPos - 25}
                            y={yPos - 35}
                            width="50"
                            height="25"
                            rx="4"
                            fill="#6366f1"
                          />
                          <text
                            x={xPos}
                            y={yPos - 18}
                            textAnchor="middle"
                            fontSize="12"
                            fill="white"
                            fontWeight="bold"
                          >
                            {day.minutes}m
                          </text>
                        </g>
                        
                        {/* Interactive overlay (larger than the point for easier interaction) */}
                        <circle 
                          cx={xPos} 
                          cy={yPos} 
                          r="10" 
                          fill="transparent"
                          onMouseOver={(e) => {
                            const tooltip = e.target.parentNode.querySelector('.chart-tooltip');
                            if (tooltip) tooltip.style.opacity = 1;
                          }}
                          onMouseOut={(e) => {
                            const tooltip = e.target.parentNode.querySelector('.chart-tooltip');
                            if (tooltip) tooltip.style.opacity = 0;
                          }}
                        />
                        
                        {/* Only show date labels for every 5 days to prevent crowding */}
                        {(index % 5 === 0 || index === dailyStudyTime.length - 1) && (
                          <text 
                            x={xPos} 
                            y="195" 
                            textAnchor="middle" 
                            fontSize="10" 
                            fill="#6b7280"
                          >
                            {formatDate(day.date)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
                
                {/* Graph legend */}
                <div className="absolute top-0 right-0 bg-white dark:bg-gray-700 rounded-md p-2 text-xs shadow-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mr-1"></div>
                    <span className="text-gray-600 dark:text-gray-300">Minutes studied</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No study data available yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center transform transition-all duration-300 hover:translate-x-1">
            View All
            <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {tasks && tasks.length > 0 ? (
            tasks.slice(0, 3)?.map?.((task, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${task.status === "completed" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                  {task.status === "completed" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    {task.status === "completed" ? (
                      <>
                        <span className="mr-1">Completed task:</span>
                        <span className="font-bold">{task.title}</span>
                      </>
                    ) : (
                      <>
                        <span className="mr-1">Added task:</span>
                        <span className="font-bold">{task.title}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="text-gray-500">No recent activity</p>
              <button className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                Create your first task
                <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <svg className="w-8 h-8 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold">
                Study Timer
              </h2>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="timer-container timer-display flex justify-center" data-minutes="25">
              <Timer initialMinutes={25} onComplete={handleTimerComplete} />
            </div>
          </div>
          <p className="text-white/80 text-center mb-4">
            Focus on your studies and track your progress automatically.
          </p>
          <div className="flex justify-center space-x-2">
            <button onClick={() => navigate('/tasks')} className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
              View Tasks
            </button>
            <button onClick={() => navigate('/notes')} className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors">
              Take Notes
            </button>
          </div>
        </div>
        
        {/* Feedback component */}
        <div id="feedback-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Feedback</h2>
          </div>
          <FeedbackForm />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
