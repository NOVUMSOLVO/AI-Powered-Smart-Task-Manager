import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { tasksAPI, prioritiesAPI } from '../api/api';
import { Add as AddIcon, Event as EventIcon, ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority_id: '',
    due_date: new Date()
  });
  
  const navigate = useNavigate();
  
  // Load tasks and priorities
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all tasks with due dates
        const tasksData = await tasksAPI.getAllTasks();
        const tasksWithDueDates = tasksData.filter(task => task.due_date);
        setTasks(tasksWithDueDates);
        
        // Fetch priorities
        const prioritiesData = await prioritiesAPI.getAllPriorities();
        setPriorities(prioritiesData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load calendar data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Week days for the current week
  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart)
  });
  
  // Group tasks by date
  const getTasksForDate = (date) => {
    return tasks.filter(task => 
      task.due_date && isSameDay(new Date(task.due_date), date)
    );
  };
  
  // Tasks for the selected date
  const selectedDateTasks = getTasksForDate(selectedDate);
  
  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };
  
  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };
  
  const handleAddTask = () => {
    setTaskForm({
      title: '',
      description: '',
      priority_id: '',
      due_date: selectedDate
    });
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
  
  const handleSubmitTask = async () => {
    if (!taskForm.title || !taskForm.priority_id) {
      return;
    }
    
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
  
  const getPriorityColor = (priorityName) => {
    switch(priorityName?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EventIcon sx={{ mr: 2 }} fontSize="large" />
        <Typography variant="h4" component="h1">
          Calendar View
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handlePreviousWeek}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6">
                {format(currentWeekStart, 'MMMM yyyy')}
              </Typography>
              <IconButton onClick={handleNextWeek}>
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {weekDays.map((day, index) => (
                      <TableCell key={index} align="center">
                        <Typography variant="subtitle2">
                          {format(day, 'EEE')}
                        </Typography>
                        <Typography variant="body2">
                          {format(day, 'd')}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    {weekDays.map((day, index) => {
                      const dayTasks = getTasksForDate(day);
                      const isSelected = isSameDay(day, selectedDate);
                      
                      return (
                        <TableCell 
                          key={index} 
                          align="center" 
                          sx={{ 
                            height: 100,
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'primary.light' : 'inherit',
                            color: isSelected ? 'primary.contrastText' : 'inherit',
                            verticalAlign: 'top',
                            '&:hover': {
                              backgroundColor: isSelected ? 'primary.light' : 'action.hover'
                            }
                          }}
                          onClick={() => handleDateClick(day)}
                        >
                          <Box sx={{ maxHeight: '100%', overflow: 'auto' }}>
                            {dayTasks.slice(0, 3).map((task, idx) => (
                              <Chip 
                                key={idx}
                                label={task.title}
                                size="small"
                                color={getPriorityColor(task.priority?.name)}
                                sx={{ mb: 0.5, maxWidth: '100%' }}
                              />
                            ))}
                            
                            {dayTasks.length > 3 && (
                              <Typography variant="caption" display="block">
                                +{dayTasks.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar 
              value={selectedDate}
              onChange={handleDateClick}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddTask}
              >
                Add Task
              </Button>
            </Box>
            
            {selectedDateTasks.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No tasks for this date
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {selectedDateTasks.map((task, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {task.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip 
                          label={task.priority?.name} 
                          color={getPriorityColor(task.priority?.name)} 
                          size="small" 
                        />
                        <Chip 
                          label={task.status.replace('_', ' ')} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      
                      {task.due_date && (
                        <Typography variant="body2" color="textSecondary">
                          Due: {format(new Date(task.due_date), 'h:mm a')}
                        </Typography>
                      )}
                      
                      <Button
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* New Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task for {format(selectedDate, 'MMMM d, yyyy')}</DialogTitle>
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
            >
              {priorities.map((priority) => (
                <MenuItem key={priority.id} value={priority.id}>
                  {priority.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateCalendar
              value={taskForm.due_date}
              onChange={handleDateChange}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmitTask} 
            variant="contained" 
            disabled={!taskForm.title || !taskForm.priority_id || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarView;
