import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Dashboard from '../../components/Dashboard';
import * as api from '../../api/api';

// Mock the API calls
jest.mock('../../api/api', () => ({
  tasksAPI: {
    getTasks: jest.fn(),
    getTaskStats: jest.fn(),
  },
  prioritiesAPI: {
    getPriorities: jest.fn(),
  },
  aiAPI: {
    getRecommendations: jest.fn(),
  },
}));

describe('Dashboard Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockTasks = [
    {
      id: 1,
      title: 'Complete project documentation',
      description: 'Write comprehensive user guides',
      due_date: '2025-06-01T12:00:00Z',
      is_completed: false,
      priority_id: 2,
      priority: { id: 2, name: 'Medium', weight: 2 }
    },
    {
      id: 2,
      title: 'Fix critical bug',
      description: 'Address security vulnerability',
      due_date: '2025-05-30T10:00:00Z',
      is_completed: true,
      priority_id: 1,
      priority: { id: 1, name: 'High', weight: 3 }
    }
  ];

  const mockStats = {
    total_tasks: 10,
    completed_tasks: 6,
    pending_tasks: 4,
    overdue_tasks: 2,
    tasks_due_today: 1,
    completion_rate: 60
  };

  const mockRecommendations = [
    {
      id: 1,
      type: 'priority',
      message: 'Consider prioritizing tasks with approaching deadlines',
      action: 'review_priorities'
    },
    {
      id: 2,
      type: 'productivity',
      message: 'You have completed 3 tasks this week. Great progress!',
      action: 'continue_momentum'
    }
  ];

  const renderDashboardWithContext = (contextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={contextValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.tasksAPI.getTasks.mockResolvedValue({ data: mockTasks });
    api.tasksAPI.getTaskStats.mockResolvedValue({ data: mockStats });
    api.aiAPI.getRecommendations.mockResolvedValue({ data: mockRecommendations });
  });

  test('renders dashboard with welcome message', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    expect(screen.getByText(/Welcome back, testuser/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(api.tasksAPI.getTaskStats).toHaveBeenCalled();
    });
  });

  test('displays task statistics correctly', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('6')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('4')).toBeInTheDocument(); // Pending tasks
      expect(screen.getByText('2')).toBeInTheDocument(); // Overdue tasks
    });
  });

  test('shows completion rate progress', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
  });

  test('displays recent tasks', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
      expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
    });
  });

  test('shows AI recommendations', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText(/Consider prioritizing tasks with approaching deadlines/i)).toBeInTheDocument();
      expect(screen.getByText(/You have completed 3 tasks this week/i)).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    api.tasksAPI.getTaskStats.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    api.tasksAPI.getTaskStats.mockRejectedValue(new Error('Failed to load stats'));
    
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText(/Error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  test('navigates to tasks when view all tasks is clicked', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/View all tasks/i));
    // Would need to test navigation with react-router testing utilities
  });

  test('displays quick actions', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText(/Create new task/i)).toBeInTheDocument();
      expect(screen.getByText(/View calendar/i)).toBeInTheDocument();
      expect(screen.getByText(/Review priorities/i)).toBeInTheDocument();
    });
  });

  test('handles empty task list', async () => {
    api.tasksAPI.getTasks.mockResolvedValue({ data: [] });
    api.tasksAPI.getTaskStats.mockResolvedValue({ 
      data: { ...mockStats, total_tasks: 0, completed_tasks: 0, pending_tasks: 0 }
    });
    
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Total tasks
    });
  });

  test('refreshes data when refresh button is clicked', async () => {
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      expect(api.tasksAPI.getTaskStats).toHaveBeenCalledTimes(1);
    });
    
    fireEvent.click(screen.getByTestId('refresh-button'));
    
    await waitFor(() => {
      expect(api.tasksAPI.getTaskStats).toHaveBeenCalledTimes(2);
    });
  });

  test('filters recent tasks correctly', async () => {
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      due_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
      is_completed: i % 2 === 0,
      priority_id: (i % 3) + 1,
      priority: { id: (i % 3) + 1, name: ['Low', 'Medium', 'High'][i % 3], weight: i % 3 + 1 }
    }));
    
    api.tasksAPI.getTasks.mockResolvedValue({ data: manyTasks });
    
    renderDashboardWithContext({ user: mockUser, loading: false, error: null });
    
    await waitFor(() => {
      // Should only show first 5 recent tasks
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 5')).toBeInTheDocument();
      expect(screen.queryByText('Task 6')).not.toBeInTheDocument();
    });
  });
});
