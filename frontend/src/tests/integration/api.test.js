import { tasksAPI, prioritiesAPI } from '../../api/api';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('Tasks API Integration', () => {
  const mockTask = {
    id: 1,
    title: 'Test task',
    description: 'This is a test task',
    due_date: '2025-06-01T12:00:00Z',
    is_completed: false,
    priority_id: 1
  };

  const mockTasks = [mockTask];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getTasks fetches tasks from API', async () => {
    axios.get.mockResolvedValueOnce({ data: mockTasks });
    
    const result = await tasksAPI.getTasks();
    
    expect(axios.get).toHaveBeenCalledWith('/tasks');
    expect(result.data).toEqual(mockTasks);
  });

  test('getTask fetches a single task by ID', async () => {
    axios.get.mockResolvedValueOnce({ data: mockTask });
    
    const result = await tasksAPI.getTask(1);
    
    expect(axios.get).toHaveBeenCalledWith('/tasks/1');
    expect(result.data).toEqual(mockTask);
  });

  test('createTask sends task data to API', async () => {
    const newTask = {
      title: 'New task',
      description: 'This is a new task',
      due_date: '2025-06-15T14:00:00Z',
      priority_id: 2
    };
    
    axios.post.mockResolvedValueOnce({ data: { ...newTask, id: 2 } });
    
    const result = await tasksAPI.createTask(newTask);
    
    expect(axios.post).toHaveBeenCalledWith('/tasks', newTask);
    expect(result.data.id).toBe(2);
  });

  test('updateTask updates a task via API', async () => {
    const updatedTask = {
      ...mockTask,
      title: 'Updated title'
    };
    
    axios.put.mockResolvedValueOnce({ data: updatedTask });
    
    const result = await tasksAPI.updateTask(1, updatedTask);
    
    expect(axios.put).toHaveBeenCalledWith('/tasks/1', updatedTask);
    expect(result.data.title).toBe('Updated title');
  });

  test('deleteTask removes a task via API', async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    
    const result = await tasksAPI.deleteTask(1);
    
    expect(axios.delete).toHaveBeenCalledWith('/tasks/1');
    expect(result.data.success).toBe(true);
  });
});

describe('Priorities API Integration', () => {
  const mockPriorities = [
    { id: 1, name: 'High', weight: 3 },
    { id: 2, name: 'Medium', weight: 2 },
    { id: 3, name: 'Low', weight: 1 }
  ];

  test('getPriorities fetches priorities from API', async () => {
    axios.get.mockResolvedValueOnce({ data: mockPriorities });
    
    const result = await prioritiesAPI.getPriorities();
    
    expect(axios.get).toHaveBeenCalledWith('/priorities');
    expect(result.data).toEqual(mockPriorities);
    expect(result.data.length).toBe(3);
  });
});
