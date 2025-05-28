import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { tasksAPI, prioritiesAPI } from '../api/api';
import { format } from 'date-fns';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: '',
    priority_id: '',
    due_date: null
  });
  
  // Load task, dependencies, and priorities
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch task details
        const taskData = await tasksAPI.getTask(id);
        setTask(taskData);
        
        // Initialize form with task data
        setTaskForm({
          title: taskData.title,
          description: taskData.description || '',
          status: taskData.status,
          priority_id: taskData.priority_id,
          due_date: taskData.due_date ? new Date(taskData.due_date) : null
        });
        
        // Fetch dependencies
        const depsData = await tasksAPI.getTaskDependencies(id);
        setDependencies(depsData);
        
        // Fetch priorities
        const prioritiesData = await prioritiesAPI.getAllPriorities();
        setPriorities(prioritiesData);
        
        // Fetch all tasks for dependency selection
        const allTasks = await tasksAPI.getAllTasks();
        // Filter out the current task and existing dependencies
        const availableTasks = allTasks.filter(t => 
          t.id !== parseInt(id) && 
          !depsData.some(dep => dep.id === t.id)
        );
        setAvailableTasks(availableTasks);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('Failed to load task details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleEditClick = () => {
    setEditing(true);
  };
  
  const handleCancelEdit = () => {
    // Reset form to original task data
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority_id: task.priority_id,
      due_date: task.due_date ? new Date(task.due_date) : null
    });
    setEditing(false);
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (newDate) => {
    setTaskForm(prev => ({
      ...prev,
      due_date: newDate
    }));
  };
  
  const handleSaveClick = async () => {
    setLoading(true);
    try {
      const updatedTask = await tasksAPI.updateTask(id, taskForm);
      setTask(updatedTask);
      setEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = () => {
    setSelectedTaskId('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleAddDependency = async () => {
    if (!selectedTaskId) return;
    
    setLoading(true);
    try {
      await tasksAPI.addTaskDependency(id, selectedTaskId);
      
      // Refresh dependencies
      const depsData = await tasksAPI.getTaskDependencies(id);
      setDependencies(depsData);
      
      // Update available tasks
      setAvailableTasks(prevAvailable => 
        prevAvailable.filter(t => t.id !== parseInt(selectedTaskId))
      );
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error adding dependency:', err);
      setError('Failed to add dependency. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveDependency = async (dependencyId) => {
    setLoading(true);
    try {
      await tasksAPI.removeTaskDependency(id, dependencyId);
      
      // Update dependencies list
      setDependencies(prevDeps => prevDeps.filter(dep => dep.id !== dependencyId));
      
      // Update available tasks
      const removedTask = task => task.id === dependencyId;
      if (removedTask) {
        setAvailableTasks(prev => [...prev, removedTask]);
      }
    } catch (err) {
      console.error('Error removing dependency:', err);
      setError('Failed to remove dependency. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    setLoading(true);
    try {
      await tasksAPI.deleteTask(id);
      navigate('/');
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
      setLoading(false);
    }
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
  
  if (loading && !task) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !task) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!task) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Task not found.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{ mb: 2 }}
      >
        Back to Tasks
      </Button>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} display="flex" justifyContent="space-between">
            {editing ? (
              <TextField
                fullWidth
                name="title"
                label="Title"
                value={taskForm.title}
                onChange={handleFormChange}
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography variant="h5" component="h1">
                {task.title}
              </Typography>
            )}
            
            <Box>
              {editing ? (
                <>
                  <IconButton 
                    color="primary" 
                    onClick={handleSaveClick}
                    disabled={loading}
                  >
                    <SaveIcon />
                  </IconButton>
                  <IconButton 
                    color="default" 
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    <CancelIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton color="primary" onClick={handleEditClick}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={handleDeleteTask}>
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Status:
            </Typography>
            {editing ? (
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  name="status"
                  value={taskForm.status}
                  label="Status"
                  onChange={handleFormChange}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <Chip 
                label={task.status.replace('_', ' ')} 
                color={getStatusColor(task.status)} 
                size="small" 
                sx={{ mt: 1 }}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Priority:
            </Typography>
            {editing ? (
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority_id"
                  name="priority_id"
                  value={taskForm.priority_id}
                  label="Priority"
                  onChange={handleFormChange}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.id} value={priority.id}>
                      {priority.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Chip 
                label={task.priority?.name || 'Unknown'} 
                color={getPriorityColor(task.priority?.name)} 
                size="small" 
                sx={{ mt: 1 }}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Due Date:
            </Typography>
            {editing ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  value={taskForm.due_date}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'dense',
                      size: 'small'
                    }
                  }}
                />
              </LocalizationProvider>
            ) : (
              <Typography variant="body1">
                {task.due_date 
                  ? format(new Date(task.due_date), 'MMM d, yyyy h:mm a')
                  : 'No due date'}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Created At:
            </Typography>
            <Typography variant="body1">
              {format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
              Description:
            </Typography>
            {editing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                value={taskForm.description}
                onChange={handleFormChange}
              />
            ) : (
              <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {task.description || 'No description provided'}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Dependencies
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={handleOpenDialog}
                disabled={availableTasks.length === 0}
              >
                Add Dependency
              </Button>
            </Box>
            
            {dependencies.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No dependencies for this task
              </Typography>
            ) : (
              <List>
                {dependencies.map(dep => (
                  <ListItem key={dep.id}>
                    <ListItemText
                      primary={dep.title}
                      secondary={`Status: ${dep.status.replace('_', ' ')} | Priority: ${dep.priority?.name || 'Unknown'}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Remove Dependency">
                        <IconButton 
                          edge="end" 
                          aria-label="remove dependency"
                          onClick={() => handleRemoveDependency(dep.id)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Dependency Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task Dependency</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select a task that this task depends on.
          </Typography>
          
          {availableTasks.length === 0 ? (
            <Alert severity="info">
              No available tasks to add as dependencies.
            </Alert>
          ) : (
            <FormControl fullWidth margin="dense">
              <InputLabel id="dependency-task-label">Select Task</InputLabel>
              <Select
                labelId="dependency-task-label"
                id="dependency-task"
                value={selectedTaskId}
                label="Select Task"
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                {availableTasks.map((task) => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddDependency} 
            variant="contained"
            disabled={!selectedTaskId || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail;
