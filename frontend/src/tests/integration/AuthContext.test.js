import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../../context/AuthContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test('provides auth state and methods', () => {
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    expect(contextValue).toHaveProperty('isAuthenticated');
    expect(contextValue).toHaveProperty('user');
    expect(contextValue).toHaveProperty('loading');
    expect(contextValue).toHaveProperty('error');
    expect(contextValue).toHaveProperty('login');
    expect(contextValue).toHaveProperty('logout');
    expect(contextValue).toHaveProperty('register');
  });

  test('initializes with stored token', async () => {
    // Set up localStorage with a token
    window.localStorage.setItem('token', 'test-token');
    window.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
    
    axios.get.mockResolvedValueOnce({ data: { id: 1, username: 'testuser' } });
    
    let contextValue;
    
    await act(async () => {
      render(
        <AuthProvider>
          <AuthContext.Consumer>
            {value => {
              contextValue = value;
              return null;
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );
    });
    
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.user).toEqual({ id: 1, username: 'testuser' });
  });

  test('login sets auth state', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'new-token',
        user: { id: 2, username: 'newuser' }
      }
    });
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    expect(contextValue.isAuthenticated).toBe(false);
    
    await act(async () => {
      await contextValue.login({ username: 'newuser', password: 'password123' });
    });
    
    expect(axios.post).toHaveBeenCalledWith('/auth/login', {
      username: 'newuser',
      password: 'password123'
    });
    
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.user).toEqual({ id: 2, username: 'newuser' });
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 2, username: 'newuser' }));
  });

  test('logout clears auth state', async () => {
    // Set up initial authenticated state
    window.localStorage.setItem('token', 'test-token');
    window.localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
    
    axios.get.mockResolvedValueOnce({ data: { id: 1, username: 'testuser' } });
    
    let contextValue;
    
    await act(async () => {
      render(
        <AuthProvider>
          <AuthContext.Consumer>
            {value => {
              contextValue = value;
              return null;
            }}
          </AuthContext.Consumer>
        </AuthProvider>
      );
    });
    
    expect(contextValue.isAuthenticated).toBe(true);
    
    act(() => {
      contextValue.logout();
    });
    
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.user).toBe(null);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  test('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({
      response: { data: { detail: errorMessage } }
    });
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {value => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.login({ username: 'baduser', password: 'wrongpass' });
    });
    
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.error).toBe(errorMessage);
  });
});
