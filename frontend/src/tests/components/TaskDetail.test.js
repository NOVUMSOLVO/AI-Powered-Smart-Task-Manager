import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskDetail from '../../components/TaskDetail';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api', () => ({
  tasksAPI: {
    getTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
  prioritiesAPI: {
    getPriorities: jest.fn(),
  },
}));

// Mock useNavigate and useParams
const mockNavigate = jest.fn();
const mockParams = { id: '1' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

describe('TaskDetail Component', () => {
  const mockTask = {
    id: 1,
    title: 'Complete project documentation',
    description: 'Write up user guides and API documentation',
    due_date: '2025-06-01T12:00:00Z',
    is_completed: false,
    priority_id: 2,
    priority: { id: 2, name: 'Medium', weight: 2 }
  };

  const mockPriorities = [
    { id: 1, name: 'High', weight: 3 },
    { id: 2, name: 'Medium', weight: 2 },
    { id: 3, name: 'Low', weight: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.tasksAPI.getTask.mockResolvedValue({ data: mockTask });
    api.prioritiesAPI.getPriorities.mockResolvedValue({ data: mockPriorities });
  });

  test('renders task details correctly', async () => {
    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Write up user guides and API documentation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    api.tasksAPI.getTask.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('handles task not found', async () => {
    api.tasksAPI.getTask.mockRejectedValue(new Error('Task not found'));
    
    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Task not found/i)).toBeInTheDocument();
    });
  });

  test('enables edit mode when edit button is clicked', async () => {
    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('edit-button'));

    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('updates task when save button is clicked', async () => {
    const updatedTask = { ...mockTask, title: 'Updated Title' };
    api.tasksAPI.updateTask.mockResolvedValue({ data: updatedTask });

    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('edit-button'));

    // Update the title
    const titleInput = screen.getByDisplayValue('Complete project documentation');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(api.tasksAPI.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({
        title: 'Updated Title'
      }));
    });
  });

  test('cancels edit mode without saving', async () => {
    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('edit-button'));

    // Update the title
    const titleInput = screen.getByDisplayValue('Complete project documentation');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    // Cancel changes
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Should revert to original title
    expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    expect(api.tasksAPI.updateTask).not.toHaveBeenCalled();
  });

  test('deletes task when delete button is clicked', async () => {
    api.tasksAPI.deleteTask.mockResolvedValue({ data: { success: true } });

    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-button'));

    // Confirm deletion in dialog
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(api.tasksAPI.deleteTask).toHaveBeenCalledWith(1);
      expect(mockNavigate).toHaveBeenCalledWith('/tasks');
    });
  });

  test('toggles task completion status', async () => {
    const completedTask = { ...mockTask, is_completed: true };
    api.tasksAPI.updateTask.mockResolvedValue({ data: completedTask });

    render(
      <BrowserRouter>
        <TaskDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(api.tasksAPI.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({
        is_completed: true
      }));
    });
  });
});
