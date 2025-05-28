import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { AuthContext } from '../../context/AuthContext';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  tasksAPI: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
  prioritiesAPI: {
    getPriorities: jest.fn(),
  },
}));

describe('App Integration Tests', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockTasks = [
    {
      id: 1,
      title: 'Test task',
      description: 'This is a test task',
      due_date: '2025-06-01T12:00:00Z',
      is_completed: false,
      priority_id: 2,
      priority: { id: 2, name: 'Medium', weight: 2 }
    }
  ];

  const mockPriorities = [
    { id: 1, name: 'High', weight: 3 },
    { id: 2, name: 'Medium', weight: 2 },
    { id: 3, name: 'Low', weight: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.tasksAPI.getTasks.mockResolvedValue({ data: mockTasks });
    api.prioritiesAPI.getPriorities.mockResolvedValue({ data: mockPriorities });
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  test('shows login page when user is not authenticated', () => {
    Storage.prototype.getItem.mockReturnValue(null);
    
    render(<App />);
    
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('shows dashboard when user is authenticated', async () => {
    Storage.prototype.getItem.mockReturnValue('fake-jwt-token');
    api.authAPI.getCurrentUser.mockResolvedValue({ data: mockUser });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  test('complete user authentication flow', async () => {
    Storage.prototype.getItem.mockReturnValue(null);
    api.authAPI.login.mockResolvedValue({ 
      data: { 
        access_token: 'fake-jwt-token',
        user: mockUser 
      } 
    });
    
    render(<App />);
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText(/Username/i), { 
      target: { value: 'testuser' } 
    });
    fireEvent.change(screen.getByLabelText(/Password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit login form
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    await waitFor(() => {
      expect(api.authAPI.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  test('complete task management flow', async () => {
    Storage.prototype.getItem.mockReturnValue('fake-jwt-token');
    api.authAPI.getCurrentUser.mockResolvedValue({ data: mockUser });
    api.tasksAPI.createTask.mockResolvedValue({
      data: {
        id: 2,
        title: 'New task',
        description: 'This is a new task',
        due_date: '2025-06-15T14:00:00Z',
        is_completed: false,
        priority_id: 1,
        priority: { id: 1, name: 'High', weight: 3 }
      }
    });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
    
    // Navigate to tasks
    fireEvent.click(screen.getByText(/Tasks/i));
    
    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeInTheDocument();
    });
    
    // Create new task
    fireEvent.click(screen.getByTestId('add-task-button'));
    
    // Fill in task form
    fireEvent.change(screen.getByLabelText(/Title/i), { 
      target: { value: 'New task' } 
    });
    fireEvent.change(screen.getByLabelText(/Description/i), { 
      target: { value: 'This is a new task' } 
    });
    
    // Submit task form
    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    
    await waitFor(() => {
      expect(api.tasksAPI.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New task',
          description: 'This is a new task'
        })
      );
    });
  });

  test('navigation between different views works correctly', async () => {
    Storage.prototype.getItem.mockReturnValue('fake-jwt-token');
    api.authAPI.getCurrentUser.mockResolvedValue({ data: mockUser });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
    
    // Navigate to Calendar
    fireEvent.click(screen.getByText(/Calendar/i));
    expect(screen.getByText(/Calendar View/i)).toBeInTheDocument();
    
    // Navigate back to Tasks
    fireEvent.click(screen.getByText(/Tasks/i));
    await waitFor(() => {
      expect(screen.getByText('Test task')).toBeInTheDocument();
    });
    
    // Navigate to Dashboard
    fireEvent.click(screen.getByText(/Dashboard/i));
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  test('error handling throughout the application', async () => {
    Storage.prototype.getItem.mockReturnValue('fake-jwt-token');
    api.authAPI.getCurrentUser.mockRejectedValue(new Error('Authentication failed'));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
    
    // Should redirect to login on auth error
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  });

  test('logout functionality works correctly', async () => {
    Storage.prototype.getItem.mockReturnValue('fake-jwt-token');
    api.authAPI.getCurrentUser.mockResolvedValue({ data: mockUser });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
    
    // Click logout
    fireEvent.click(screen.getByTestId('logout-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
    
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('token');
  });
});
