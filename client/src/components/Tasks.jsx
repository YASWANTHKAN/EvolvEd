import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../features/tasks/taskSlice";
import { FaTrash, FaPlus } from "react-icons/fa";

function Tasks() {
  const dispatch = useDispatch();
  const { tasks, isLoading, isError, message } = useSelector(
    (state) => state.tasks
  );
  const { user } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState("All");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    tags: [],
    status: "Active",
  });

  useEffect(() => {
    if (user) {
      dispatch(getTasks());
    }
  }, [dispatch, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      try {
        await dispatch(
          createTask({
            title: newTask.title,
            description: newTask.description,
            dueDate: newTask.dueDate,
            priority: newTask.priority,
            status: "Active",
          })
        ).unwrap();

        setNewTask({
          title: "",
          description: "",
          dueDate: "",
          priority: "Medium",
          tags: [],
          status: "Active",
        });
        setShowAddTask(false);
      } catch (error) {
        console.error("Failed to create task:", error);
      }
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    try {
      await dispatch(
        updateTask({
          taskId,
          taskData: {
            status: currentStatus === "Active" ? "Completed" : "Active",
          },
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  const filteredTasks = tasks?.filter?.((task) => {
    if (filter === "All") return true;
    return task.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">Loading...</div>
    );
  }

  if (isError) {
    return <div className="text-red-600 p-4">Error: {message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <FaPlus /> Add Task
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-4">
          {["All", "Active", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      {showAddTask && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div className="mb-4">
              <textarea
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No tasks found. Click "Add Task" to create one.
          </div>
        ) : (
          filteredTasks?.map((task) => (
            <div
              key={task._id}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={task.status === "Completed"}
                  onChange={() => handleStatusChange(task._id, task.status)}
                  className="h-5 w-5 rounded border-gray-300"
                />
                <div>
                  <h3
                    className={`font-medium ${
                      task.status === "Completed"
                        ? "line-through text-gray-500"
                        : ""
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600">{task.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(task._id)}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Tasks;
