import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CalendarView from '../../components/CalendarView';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api', () => ({
  tasksAPI: {
    getTasks: jest.fn(),
  },
}));

describe('CalendarView Component', () => {
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
      due_date: '2025-06-15T10:00:00Z',
      is_completed: false,
      priority_id: 1,
      priority: { id: 1, name: 'High', weight: 3 }
    },
    {
      id: 3,
      title: 'Team meeting',
      description: 'Weekly standup meeting',
      due_date: '2025-05-30T14:00:00Z',
      is_completed: true,
      priority_id: 2,
      priority: { id: 2, name: 'Medium', weight: 2 }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.tasksAPI.getTasks.mockResolvedValue({ data: mockTasks });
  });

  test('renders calendar view correctly', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Calendar View/i)).toBeInTheDocument();
    expect(screen.getByText(/Today/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.tasksAPI.getTasks).toHaveBeenCalled();
    });
  });

  test('displays tasks on calendar', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
    expect(screen.getByText('Team meeting')).toBeInTheDocument();
  });

  test('navigates between months', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.tasksAPI.getTasks).toHaveBeenCalled();
    });

    // Navigate to next month
    fireEvent.click(screen.getByTestId('next-month-button'));
    
    // Navigate to previous month  
    fireEvent.click(screen.getByTestId('prev-month-button'));
  });

  test('shows task details when task is clicked', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete project documentation'));

    expect(screen.getByText(/Write up user guides and API documentation/i)).toBeInTheDocument();
  });

  test('filters tasks by completion status', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    // Initially all tasks should be visible
    expect(screen.getByText('Team meeting')).toBeInTheDocument();

    // Toggle to show only incomplete tasks
    fireEvent.click(screen.getByTestId('filter-incomplete'));

    // Completed task should not be visible
    expect(screen.queryByText('Team meeting')).not.toBeInTheDocument();
    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
  });

  test('filters tasks by priority', async () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });

    // Filter by high priority
    fireEvent.click(screen.getByTestId('filter-high-priority'));

    // Only high priority task should be visible
    expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
    expect(screen.queryByText('Complete project documentation')).not.toBeInTheDocument();
  });

  test('shows current date indicator', () => {
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    const today = new Date();
    const currentDate = today.getDate().toString();
    
    // Should have a special indicator for today
    expect(screen.getByTestId(`date-${currentDate}`)).toHaveClass('current-date');
  });

  test('displays loading state', () => {
    api.tasksAPI.getTasks.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
