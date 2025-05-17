import axios from "axios";
import config from "../../config";

const API_URL = `${config.API_URL}/api/tasks/`;

// Create new task
const createTask = async (taskData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.post(API_URL, taskData, config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create task");
  }
};

// Get user tasks
const getTasks = async (token) => {
  console.log("getTasks", token);
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch tasks");
  }
};

// Update task
const updateTask = async (taskId, taskData, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(API_URL + taskId, taskData, config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update task");
  }
};

// Delete task
const deleteTask = async (taskId, token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.delete(API_URL + taskId, config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete task");
  }
};

const taskService = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};

export default taskService;
