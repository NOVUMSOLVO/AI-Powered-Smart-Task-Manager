import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Grid,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { tasksAPI, prioritiesAPI } from '../api/api';
import { format } from 'date-fns';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority_id: '',
    due_date: null
  });
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();
  
  // Load tasks and priorities
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch priorities
        const prioritiesData = await prioritiesAPI.getAllPriorities();
        setPriorities(prioritiesData);
        
        // Fetch tasks with optional filters
        const filters = {};
        if (filterStatus) filters.status = filterStatus;
        if (filterPriority) filters.priority_id = filterPriority;
        
        const tasksData = await tasksAPI.getAllTasks(filters);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [filterStatus, filterPriority]);
  
  const handleOpenDialog = () => {
    setTaskForm({
      title: '',
      description: '',
      priority_id: '',
      due_date: null
    });
    setFormErrors({});
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleTaskFormChange = (e) => {
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
  
  const handleTaskSubmit = async () => {
    // Form validation
    const validationErrors = {};
    if (!taskForm.title.trim()) {
      validationErrors.title = 'Title is required';
    }
    if (!taskForm.priority_id) {
      validationErrors.priority_id = 'Priority is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    
    // Clear previous errors
    setFormErrors({});
    
    setLoading(true);
    try {
      const newTask = await tasksAPI.createTask(taskForm);
      setTasks(prevTasks => [...prevTasks, newTask]);
      handleCloseDialog();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    setLoading(true);
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    } finally {
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
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tasks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Task
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                label="Filter by Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="priority-filter-label">Filter by Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                id="priority-filter"
                value={filterPriority}
                label="Filter by Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                {priorities.map((priority) => (
                  <MenuItem key={priority.id} value={priority.id}>
                    {priority.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>}
      
      {!loading && tasks.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            No tasks found. Create a new task to get started!
          </Typography>
        </Paper>
      )}
      
      <Grid container spacing={2}>
        {tasks.map(task => (
          <Grid item xs={12} sm={6} md={4} key={task.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="div" gutterBottom>
                  {task.title}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip 
                    label={task.priority?.name || 'Unknown'} 
                    color={getPriorityColor(task.priority?.name)} 
                    size="small" 
                  />
                  <Chip 
                    label={task.status.replace('_', ' ')} 
                    color={getStatusColor(task.status)} 
                    size="small" 
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                  {task.description || 'No description'}
                </Typography>
                
                {task.due_date && (
                  <Typography variant="body2">
                    Due: {format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}
                  </Typography>
                )}
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  View Details
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/tasks/${task.id}/edit`)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* New Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            name="title"
            label="Task Title"
            type="text"
            fullWidth
            variant="outlined"
            value={taskForm.title}
            onChange={handleTaskFormChange}
            error={!!formErrors.title}
            helperText={formErrors.title}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={taskForm.description}
            onChange={handleTaskFormChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="priority-label">Priority</InputLabel>
            <Select
              labelId="priority-label"
              id="priority_id"
              name="priority_id"
              value={taskForm.priority_id}
              label="Priority"
              onChange={handleTaskFormChange}
              error={!!formErrors.priority_id}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.id} value={priority.id}>
                  {priority.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.priority_id && (
              <Typography variant="caption" color="error">
                {formErrors.priority_id}
              </Typography>
            )}
          </FormControl>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Due Date"
              value={taskForm.due_date}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'dense',
                  variant: 'outlined'
                }
              }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleTaskSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList;
