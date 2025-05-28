import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { 
  Psychology as PsychologyIcon,
  AssignmentLate as AssignmentLateIcon,
  Star as StarIcon,
  Update as UpdateIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { tasksAPI } from '../api/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch tasks and simulate AI recommendations
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // Get all tasks
        const tasks = await tasksAPI.getAllTasks();
        
        if (tasks.length === 0) {
          setRecommendations([]);
          return;
        }
        
        // Simulate AI recommendations
        const aiRecommendations = generateAIRecommendations(tasks);
        setRecommendations(aiRecommendations);
        setError(null);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to generate recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Function to simulate AI recommendations based on task properties
  const generateAIRecommendations = (tasks) => {
    const recommendations = [];
    const now = new Date();
    
    // 1. Find overdue tasks
    const overdueTasks = tasks.filter(task => {
      return task.due_date && new Date(task.due_date) < now && task.status !== 'completed';
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'overdue',
        title: 'Overdue Tasks',
        icon: <AssignmentLateIcon fontSize="large" color="error" />,
        description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider addressing these first.`,
        tasks: overdueTasks.slice(0, 3),
        color: 'error.light',
        priority: 10
      });
    }
    
    // 2. Find high priority tasks
    const highPriorityTasks = tasks.filter(task => {
      return task.priority?.name?.toLowerCase() === 'high' && task.status !== 'completed';
    });
    
    if (highPriorityTasks.length > 0) {
      recommendations.push({
        type: 'high-priority',
        title: 'High Priority Tasks',
        icon: <StarIcon fontSize="large" color="warning" />,
        description: `You have ${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? 's' : ''} that should be addressed soon.`,
        tasks: highPriorityTasks.slice(0, 3),
        color: 'warning.light',
        priority: 8
      });
    }
    
    // 3. Find tasks due soon (next 48 hours)
    const dueSoonTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      
      const dueDate = new Date(task.due_date);
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
      return hoursUntilDue > 0 && hoursUntilDue <= 48;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    if (dueSoonTasks.length > 0) {
      recommendations.push({
        type: 'due-soon',
        title: 'Tasks Due Soon',
        icon: <UpdateIcon fontSize="large" color="info" />,
        description: `You have ${dueSoonTasks.length} task${dueSoonTasks.length > 1 ? 's' : ''} due in the next 48 hours.`,
        tasks: dueSoonTasks.slice(0, 3),
        color: 'info.light',
        priority: 7
      });
    }
    
    // 4. Tasks almost complete (status = in_progress)
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    
    if (inProgressTasks.length > 0) {
      recommendations.push({
        type: 'in-progress',
        title: 'Tasks In Progress',
        icon: <CheckIcon fontSize="large" color="success" />,
        description: `You have ${inProgressTasks.length} task${inProgressTasks.length > 1 ? 's' : ''} in progress. Consider finishing these to maintain momentum.`,
        tasks: inProgressTasks.slice(0, 3),
        color: 'success.light',
        priority: 5
      });
    }
    
    // Sort recommendations by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  };

  const getPriorityColor = (priorityName) => {
    switch(priorityName?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <PsychologyIcon fontSize="large" color="primary" />
        <Typography variant="h4" component="h1">
          AI Recommendations
        </Typography>
      </Box>
      
      {recommendations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" component="div" gutterBottom>
            No recommendations available
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create more tasks to get personalized AI recommendations.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {recommendations.map((recommendation, idx) => (
            <Grid item xs={12} key={idx}>
              <Card sx={{ bgcolor: recommendation.color }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                    {recommendation.icon}
                    <Typography variant="h6" component="div">
                      {recommendation.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {recommendation.description}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    {recommendation.tasks.map(task => (
                      <ListItem key={task.id} alignItems="flex-start" sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getPriorityColor(task.priority?.name) }}>
                            {task.priority?.name?.charAt(0) || 'T'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <React.Fragment>
                              <Box sx={{ display: 'flex', gap: 1, my: 0.5 }}>
                                <Chip 
                                  label={task.status.replace('_', ' ')} 
                                  color={getStatusColor(task.status)} 
                                  size="small" 
                                />
                                {task.due_date && (
                                  <Chip 
                                    label={`Due: ${format(new Date(task.due_date), 'MMM d')}`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              {task.description && (
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                  noWrap
                                >
                                  {task.description}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/tasks?type=${recommendation.type}`)}
                  >
                    View All
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AIRecommendations;
