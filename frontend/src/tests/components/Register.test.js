import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Register from '../../components/Register';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  const mockRegister = jest.fn();

  const renderRegisterWithContext = (contextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={contextValue}>
          <Register />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form correctly', () => {
    renderRegisterWithContext({ register: mockRegister, loading: false, error: null });
    
    expect(screen.getByText(/Sign up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderRegisterWithContext({ register: mockRegister, loading: false, error: null });
    
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  test('shows validation error for password mismatch', async () => {
    renderRegisterWithContext({ register: mockRegister, loading: false, error: null });
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('calls register function with form data on valid submit', async () => {
    renderRegisterWithContext({ register: mockRegister, loading: false, error: null });
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  test('shows loading state during registration', () => {
    renderRegisterWithContext({ register: mockRegister, loading: true, error: null });
    
    expect(screen.getByRole('button', { name: /Register/i })).toBeDisabled();
  });

  test('displays error message when registration fails', () => {
    const errorMessage = 'Email already exists';
    renderRegisterWithContext({ register: mockRegister, loading: false, error: errorMessage });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('has link to login page', () => {
    renderRegisterWithContext({ register: mockRegister, loading: false, error: null });
    
    expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign in/i })).toHaveAttribute('href', '/login');
  });
});
