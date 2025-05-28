import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskList from '../../components/TaskList';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api', () => ({
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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('TaskList Component', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Complete project documentation',
      description: 'Write up user guides and API documentation',
      due_date: '2025-06-01T12:00:00Z',
      is_completed: false,
      priority_id: 2,
      priority: { id: 2, name: 'Medium', weight: 2 }
    },
    {
      id: 2,
      title: 'Fix critical bug',
      description: 'Address security vulnerability in authentication flow',
      due_date: '2025-05-30T10:00:00Z',
      is_completed: false,
      priority_id: 1,
      priority: { id: 1, name: 'High', weight: 3 }
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
  });

  test('renders task list correctly', async () => {
    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('opens create task dialog when add button is clicked', async () => {
    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(api.tasksAPI.getTasks).toHaveBeenCalledTimes(1);
    });

    // Find and click the add task button
    fireEvent.click(screen.getByTestId('add-task-button'));

    // Check if the dialog is displayed
    expect(screen.getByText('Create New Task')).toBeInTheDocument();
  });

  test('creates a new task', async () => {
    // Mock the createTask API response
    api.tasksAPI.createTask.mockResolvedValue({
      data: {
        id: 3,
        title: 'New Task',
        description: 'This is a new task',
        due_date: '2025-06-05T14:00:00Z',
        is_completed: false,
        priority_id: 1,
        priority: { id: 1, name: 'High', weight: 3 }
      }
    });

    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(api.tasksAPI.getTasks).toHaveBeenCalledTimes(1);
    });

    // Open create dialog
    fireEvent.click(screen.getByTestId('add-task-button'));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Task' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'This is a new task' } });

    // Select a priority
    fireEvent.mouseDown(screen.getByLabelText(/Priority/i));
    fireEvent.click(screen.getByText('High'));

    // Submit the form
    fireEvent.click(screen.getByText('Save'));

    // Check if the API was called
    await waitFor(() => {
      expect(api.tasksAPI.createTask).toHaveBeenCalled();
      expect(api.tasksAPI.getTasks).toHaveBeenCalledTimes(2); // Called again after creation
    });
  });

  test('deletes a task', async () => {
    // Mock the deleteTask API response
    api.tasksAPI.deleteTask.mockResolvedValue({ data: { success: true } });

    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    // Find and click the delete button for the first task
    const deleteButtons = screen.getAllByTestId('delete-task-button');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Delete'));

    // Check if the API was called
    await waitFor(() => {
      expect(api.tasksAPI.deleteTask).toHaveBeenCalledWith(1);
      expect(api.tasksAPI.getTasks).toHaveBeenCalledTimes(2); // Called again after deletion
    });
  });

  test('filters tasks by completion status', async () => {
    // Mock API response with both completed and uncompleted tasks
    const tasksWithCompleted = [
      ...mockTasks,
      {
        id: 3,
        title: 'Completed task',
        description: 'This task is done',
        due_date: '2025-05-25T09:00:00Z',
        is_completed: true,
        priority_id: 3,
        priority: { id: 3, name: 'Low', weight: 1 }
      }
    ];
    
    api.tasksAPI.getTasks.mockResolvedValue({ data: tasksWithCompleted });

    render(
      <BrowserRouter>
        <TaskList />
      </BrowserRouter>
    );

    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    // Default should show all tasks
    expect(screen.getByText('Completed task')).toBeInTheDocument();

    // Filter for active tasks only
    fireEvent.mouseDown(screen.getByLabelText(/Status/i));
    fireEvent.click(screen.getByText('Active'));

    // Completed task should be filtered out
    expect(screen.queryByText('Completed task')).not.toBeInTheDocument();

    // Filter for completed tasks only
    fireEvent.mouseDown(screen.getByLabelText(/Status/i));
    fireEvent.click(screen.getByText('Completed'));

    // Only completed task should be visible
    await waitFor(() => {
      expect(screen.queryByText('Complete project documentation')).not.toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });
  });
});
