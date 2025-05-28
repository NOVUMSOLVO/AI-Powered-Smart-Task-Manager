import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import contexts
import { AuthProvider, AuthContext } from './context/AuthContext';

// Import components
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import CalendarView from './components/CalendarView';
import AIRecommendations from './components/AIRecommendations';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// PrivateRoute component
const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading } = React.useContext(AuthContext);

  if (loading) {
    return null; // or a loading spinner
  }

  return isLoggedIn ? children : <Navigate to="/login" />;
};

// PublicRoute component (for login and register pages)
const PublicRoute = ({ children }) => {
  const { isLoggedIn, loading } = React.useContext(AuthContext);

  if (loading) {
    return null; // or a loading spinner
  }

  return !isLoggedIn ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes (login and register) */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Private routes (require authentication) */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TaskList />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TaskList />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/tasks/:id" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TaskDetail />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <PrivateRoute>
                  <Layout>
                    <CalendarView />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/ai-recommendations" 
              element={
                <PrivateRoute>
                  <Layout>
                    <AIRecommendations />
                  </Layout>
                </PrivateRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
