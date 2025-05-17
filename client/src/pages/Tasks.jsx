import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Timer from "../components/Timer";
import {
  getTasks,
  createTask,
  deleteTask,
  toggleTaskCompletion,
  reset,
} from "../features/tasks/taskSlice";

// CSS for animations and styling
const taskStyles = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes checkmark {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .task-item {
    animation: slideInRight 0.3s ease-out forwards;
    transition: all 0.3s ease;
  }

  .task-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .task-complete-animation {
    animation: checkmark 0.4s ease-in-out forwards;
  }

  .task-add-animation {
    animation: scaleIn 0.4s ease-out forwards;
  }
  
  .form-appear {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  .custom-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #cbd5e0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    outline: none;
  }
  
  .custom-checkbox:checked {
    background-color: #6366f1;
    border-color: #6366f1;
  }
  
  .custom-checkbox:checked::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 10px;
    border-right: 2px solid white;
    border-bottom: 2px solid white;
    top: 1px;
    left: 6px;
    transform: rotate(45deg);
    animation: checkmark 0.3s ease-in-out forwards;
  }
  
  .priority-badge {
    transition: all 0.3s ease;
  }
  
  .priority-badge:hover {
    transform: scale(1.05);
  }

  .task-completed {
    transition: all 0.5s ease;
  }
`;

function Tasks() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { tasks, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.tasks
  );

  const [sessionActive, setSessionActive] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().substring(0, 10),
    priority: "medium",
    category: "",
  });

  // State for showing add task form
  const [showAddTask, setShowAddTask] = useState(false);

  // Filter state
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'completed'

  // Apply styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = taskStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(getTasks());
    }

    if (isError) {
      toast.error(message);
    }

    return () => {
      dispatch(reset());
    };
  }, [user, navigate, isError, message, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value,
    });
  };

  const handleToggleCompletion = (id, status) => {
    dispatch(toggleTaskCompletion({ taskId: id, status }));
  };

  const handleAddTask = (e) => {
    e.preventDefault();

    if (!newTask.title) {
      toast.error("Please add a title");
      return;
    }

    dispatch(createTask(newTask));

    setNewTask({
      title: "",
      description: "",
      dueDate: new Date().toISOString().substring(0, 10),
      priority: "medium",
      category: "",
    });

    setShowAddTask(false);
  };

  const handleDeleteTask = (id) => {
    dispatch(deleteTask(id));
  };

  const handleTimerComplete = () => {
    alert("Study session complete! Take a break.");
    setSessionActive(false);

    // Save session data to localStorage
    const today = new Date().toISOString().split("T")[0];
    const savedHistory = localStorage.getItem("studyHistory");
    let studyHistory = savedHistory ? JSON.parse(savedHistory) : [];

    const sessionMinutes = document.getElementById("session-length")
      ? parseInt(document.getElementById("session-length").value)
      : 25;

    const todayIndex = studyHistory.findIndex((item) => item.date === today);
    if (todayIndex >= 0) {
      studyHistory[todayIndex].minutes += sessionMinutes;
    } else {
      studyHistory.push({ date: today, minutes: sessionMinutes });
    }

    localStorage.setItem("studyHistory", JSON.stringify(studyHistory));

    // Update total study time
    const savedTime = localStorage.getItem("totalStudyTime");
    const totalTime = savedTime ? parseInt(savedTime) : 0;
    localStorage.setItem(
      "totalStudyTime",
      (totalTime + sessionMinutes * 60).toString()
    );
  };

  const startStudySession = () => {
    setSessionActive(true);
  };

  const filteredTasks = tasks?.filter?.((task) => {
    if (filter === "all") return true;
    if (filter === "active") return task.status !== "completed";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  // Sort tasks by due date and priority
  const sortedTasks = filteredTasks
    ? [...filteredTasks].sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;

        // For incomplete tasks, sort by due date first
        if (a.status !== "completed" && b.status !== "completed") {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);

          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;

          // If due dates are the same, sort by priority
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        return 0;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10" style={{
      background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)",
      backgroundImage: "radial-gradient(#e0e7ff 1px, transparent 1px), radial-gradient(#e0e7ff 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 10px 10px",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      {sessionActive && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-4 border border-blue-400 flex justify-between items-center animate-fade-in">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2 mr-3">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-bold text-xl">
                Current Session
              </p>
              <p className="text-white/80">
                Focus time in progress
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Tasks
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {!sessionActive ? (
              <button
                onClick={startStudySession}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg px-4 py-2 font-medium inline-flex items-center transition-transform hover:scale-105 shadow-md"
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
                Start Study Session
              </button>
            ) : (
              <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 py-2 shadow border border-green-200">
                <span className="text-green-700 mr-3 font-medium">
                  Current Session:
                </span>
                <div className="timer-display">
                  <Timer initialMinutes={25} onComplete={handleTimerComplete} />
                </div>
              </div>
            )}
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg px-4 py-2 font-medium inline-flex items-center transition-transform hover:scale-105 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Study Session Info */}
        {sessionActive && (
          <div className="session-progress mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                  Study Session in Progress
                </h3>
              </div>
            </div>
            <p className="mt-2 text-sm text-green-700 dark:text-green-400 ml-11">
              Focus on your tasks and avoid distractions. The timer will notify
              you when it's time for a break.
            </p>
          </div>
        )}

        {/* Task Form */}
        {showAddTask && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 mb-6 shadow-md form-appear border border-indigo-100 dark:border-gray-600">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3 dark:bg-indigo-900 dark:text-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Task
              </h2>
            </div>
            <form onSubmit={handleAddTask} className="task-add-animation">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Task Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      required
                      className="shadow-sm block w-full sm:text-sm rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                      placeholder="Enter task title"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={newTask.description}
                      onChange={handleInputChange}
                      className="shadow-sm block w-full sm:text-sm rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                      placeholder="Add details about your task"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="dueDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Due Date
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="dueDate"
                      id="dueDate"
                      value={newTask.dueDate}
                      onChange={handleInputChange}
                      className="shadow-sm block w-full sm:text-sm rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="priority"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Priority
                  </label>
                  <div className="mt-1">
                    <select
                      id="priority"
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="shadow-sm block w-full sm:text-sm rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Category
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="category"
                      id="category"
                      value={newTask.category}
                      onChange={handleInputChange}
                      className="shadow-sm block w-full sm:text-sm rounded-lg p-2.5 border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-indigo-400"
                      placeholder="e.g. Math, Science, Project"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 border border-transparent shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-colors"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 inline-flex shadow-sm">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "all"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setFilter("all")}
            >
              All Tasks
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "active"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setFilter("active")}
            >
              Active
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                filter === "completed"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {tasks?.length || 0} total task{tasks?.length !== 1 ? 's' : ''}
            {tasks?.filter(t => t.status === 'completed')?.length > 0 && 
              ` • ${tasks?.filter(t => t.status === 'completed')?.length} completed`
            }
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 bg-white dark:bg-gray-700 rounded-lg shadow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading your tasks...</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900 dark:text-white">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                Get started by creating a new task.
              </p>
              <button
                onClick={() => setShowAddTask(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create a task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* High Priority Column */}
              <div className="space-y-4">
                <div className="flex items-center bg-red-50 p-3 rounded-lg mb-2 border-l-4 border-red-500 shadow-sm">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <h3 className="font-bold text-red-800">High Priority</h3>
                </div>
                
                {sortedTasks.filter(task => task.priority === 'high').length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500 border border-dashed border-gray-300">
                    No high priority tasks
                  </div>
                ) : (
                  sortedTasks
                    .filter(task => task.priority === 'high')
                    .map((task, index) => (
                      <div
                        key={task._id}
                        className={`task-item flex items-start p-4 rounded-lg shadow-sm transform transition-all duration-300 ${
                          task.status === "completed"
                            ? "bg-gray-50 dark:bg-gray-700 task-completed"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-200"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={task.status === "completed"}
                            onChange={() =>
                              handleToggleCompletion(
                                task._id,
                                task.status === "completed" ? "pending" : "completed"
                              )
                            }
                            className="custom-checkbox"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <p
                              className={`text-base font-medium mb-1 ${
                                task.status === "completed"
                                  ? "text-gray-500 dark:text-gray-400 line-through"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            
                            <div className="flex space-x-2">
                              {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p
                              className={`mt-1 text-sm ${
                                task.status === "completed"
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {task.description}
                            </p>
                          )}
                          
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {task.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {task.category}
                              </span>
                            )}
                            
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                new Date(task.dueDate) < new Date() && task.status !== "completed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
              
              {/* Medium Priority Column */}
              <div className="space-y-4">
                <div className="flex items-center bg-yellow-50 p-3 rounded-lg mb-2 border-l-4 border-yellow-500 shadow-sm">
                  <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                  </svg>
                  <h3 className="font-bold text-yellow-800">Medium Priority</h3>
                </div>
                
                {sortedTasks.filter(task => task.priority === 'medium').length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500 border border-dashed border-gray-300">
                    No medium priority tasks
                  </div>
                ) : (
                  sortedTasks
                    .filter(task => task.priority === 'medium')
                    .map((task, index) => (
                      <div
                        key={task._id}
                        className={`task-item flex items-start p-4 rounded-lg shadow-sm transform transition-all duration-300 ${
                          task.status === "completed"
                            ? "bg-gray-50 dark:bg-gray-700 task-completed"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-yellow-200"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={task.status === "completed"}
                            onChange={() =>
                              handleToggleCompletion(
                                task._id,
                                task.status === "completed" ? "pending" : "completed"
                              )
                            }
                            className="custom-checkbox"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <p
                              className={`text-base font-medium mb-1 ${
                                task.status === "completed"
                                  ? "text-gray-500 dark:text-gray-400 line-through"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            
                            <div className="flex space-x-2">
                              {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p
                              className={`mt-1 text-sm ${
                                task.status === "completed"
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {task.description}
                            </p>
                          )}
                          
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {task.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {task.category}
                              </span>
                            )}
                            
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                new Date(task.dueDate) < new Date() && task.status !== "completed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
              
              {/* Low Priority Column */}
              <div className="space-y-4">
                <div className="flex items-center bg-green-50 p-3 rounded-lg mb-2 border-l-4 border-green-500 shadow-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                  </svg>
                  <h3 className="font-bold text-green-800">Low Priority</h3>
                </div>
                
                {sortedTasks.filter(task => task.priority === 'low').length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500 border border-dashed border-gray-300">
                    No low priority tasks
                  </div>
                ) : (
                  sortedTasks
                    .filter(task => task.priority === 'low')
                    .map((task, index) => (
                      <div
                        key={task._id}
                        className={`task-item flex items-start p-4 rounded-lg shadow-sm transform transition-all duration-300 ${
                          task.status === "completed"
                            ? "bg-gray-50 dark:bg-gray-700 task-completed"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-200"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={task.status === "completed"}
                            onChange={() =>
                              handleToggleCompletion(
                                task._id,
                                task.status === "completed" ? "pending" : "completed"
                              )
                            }
                            className="custom-checkbox"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <p
                              className={`text-base font-medium mb-1 ${
                                task.status === "completed"
                                  ? "text-gray-500 dark:text-gray-400 line-through"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {task.title}
                            </p>
                            
                            <div className="flex space-x-2">
                              {new Date(task.dueDate) < new Date() && task.status !== "completed" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Overdue
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {task.description && (
                            <p
                              className={`mt-1 text-sm ${
                                task.status === "completed"
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {task.description}
                            </p>
                          )}
                          
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {task.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {task.category}
                              </span>
                            )}
                            
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                new Date(task.dueDate) < new Date() && task.status !== "completed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tasks;
