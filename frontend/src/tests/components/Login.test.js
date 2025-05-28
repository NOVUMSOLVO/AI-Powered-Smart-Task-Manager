import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Login from '../../components/Login';

// Mock AuthContext
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  const renderLoginWithContext = (contextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={contextValue}>
          <Login />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    renderLoginWithContext({ login: mockLogin, loading: false, error: null });
    
    expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderLoginWithContext({ login: mockLogin, loading: false, error: null });
    
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  test('calls login function with form data on submit', async () => {
    renderLoginWithContext({ login: mockLogin, loading: false, error: null });
    
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  test('displays loading indicator when logging in', () => {
    renderLoginWithContext({ login: mockLogin, loading: true, error: null });
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeDisabled();
  });

  test('displays error message when login fails', () => {
    renderLoginWithContext({ login: mockLogin, loading: false, error: 'Invalid credentials' });
    
    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  test('navigates to register page when clicking on the registration link', () => {
    renderLoginWithContext({ login: mockLogin, loading: false, error: null });
    
    fireEvent.click(screen.getByText(/Don't have an account\? Register/i));
    
    expect(screen.getByText(/Don't have an account\? Register/i)).toHaveAttribute('href', '/register');
  });
});
