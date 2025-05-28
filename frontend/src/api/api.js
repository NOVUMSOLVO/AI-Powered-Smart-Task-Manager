import axios from 'axios';

// Configure axios instance with base URL and versioning
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor to add authorization token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is expired or invalid, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await axios.post(`${API_BASE_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateUser: async (userData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  }
};

// Tasks API
export const tasksAPI = {
  getAllTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority_id) params.append('priority_id', filters.priority_id);
    
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },
  
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },
  
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    return true;
  },
  
  getTaskDependencies: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/dependencies`);
    return response.data;
  },
  
  addTaskDependency: async (taskId, dependentTaskId) => {
    const response = await api.post(`/tasks/${taskId}/dependencies`, {
      dependent_task_id: dependentTaskId
    });
    return response.data;
  },
  
  removeTaskDependency: async (taskId, dependencyId) => {
    await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
    return true;
  }
};

// Priorities API
export const prioritiesAPI = {
  getAllPriorities: async () => {
    const response = await api.get('/priorities');
    return response.data;
  },
  
  getPriority: async (priorityId) => {
    const response = await api.get(`/priorities/${priorityId}`);
    return response.data;
  },
  
  createPriority: async (priorityData) => {
    const response = await api.post('/priorities', priorityData);
    return response.data;
  }
};

export default api;
