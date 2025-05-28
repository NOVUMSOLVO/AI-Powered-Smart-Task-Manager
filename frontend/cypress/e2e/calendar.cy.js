describe('Calendar View', () => {
  beforeEach(() => {
    cy.task('db:reset');
    cy.task('db:createUser', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    });
    cy.login('testuser', 'testpassword123');
  });

  it('should display calendar view correctly', () => {
    cy.visit('/calendar');
    
    cy.contains('Calendar View');
    cy.get('[data-testid="calendar-grid"]').should('be.visible');
    cy.get('[data-testid="current-month"]').should('be.visible');
  });

  it('should navigate between months', () => {
    cy.visit('/calendar');
    
    // Get current month
    cy.get('[data-testid="current-month"]').then(($month) => {
      const currentMonth = $month.text();
      
      // Navigate to next month
      cy.get('[data-testid="next-month-button"]').click();
      cy.get('[data-testid="current-month"]').should('not.contain', currentMonth);
      
      // Navigate back to previous month
      cy.get('[data-testid="prev-month-button"]').click();
      cy.get('[data-testid="current-month"]').should('contain', currentMonth);
    });
  });

  it('should display tasks on calendar', () => {
    const taskDate = new Date();
    taskDate.setDate(15); // 15th of current month
    
    cy.task('db:createTask', {
      title: 'Calendar Task',
      description: 'Task displayed on calendar',
      due_date: taskDate.toISOString(),
      priority_id: 2,
      user_id: 1
    });

    cy.visit('/calendar');
    
    cy.get('[data-testid="calendar-task"]').should('contain', 'Calendar Task');
  });

  it('should show task details when clicked', () => {
    const taskDate = new Date();
    taskDate.setDate(15);
    
    cy.task('db:createTask', {
      title: 'Detailed Task',
      description: 'Task with detailed view',
      due_date: taskDate.toISOString(),
      priority_id: 1,
      user_id: 1
    });

    cy.visit('/calendar');
    
    cy.get('[data-testid="calendar-task"]').first().click();
    
    cy.get('[data-testid="task-details-modal"]').should('be.visible');
    cy.contains('Detailed Task');
    cy.contains('Task with detailed view');
  });

  it('should filter tasks by priority on calendar', () => {
    const taskDate = new Date();
    taskDate.setDate(15);
    
    cy.task('db:createTask', {
      title: 'High Priority Task',
      description: 'Important task',
      due_date: taskDate.toISOString(),
      priority_id: 1,
      user_id: 1
    });
    
    cy.task('db:createTask', {
      title: 'Low Priority Task',
      description: 'Less important task',
      due_date: taskDate.toISOString(),
      priority_id: 3,
      user_id: 1
    });

    cy.visit('/calendar');
    
    // Both tasks should be visible initially
    cy.contains('High Priority Task');
    cy.contains('Low Priority Task');
    
    // Filter by high priority
    cy.get('[data-testid="priority-filter"]').select('High');
    
    cy.contains('High Priority Task');
    cy.contains('Low Priority Task').should('not.exist');
  });

  it('should filter completed tasks on calendar', () => {
    const taskDate = new Date();
    taskDate.setDate(15);
    
    cy.task('db:createTask', {
      title: 'Completed Task',
      description: 'This task is done',
      due_date: taskDate.toISOString(),
      priority_id: 2,
      is_completed: true,
      user_id: 1
    });
    
    cy.task('db:createTask', {
      title: 'Pending Task',
      description: 'This task is pending',
      due_date: taskDate.toISOString(),
      priority_id: 2,
      is_completed: false,
      user_id: 1
    });

    cy.visit('/calendar');
    
    // Both tasks should be visible initially
    cy.contains('Completed Task');
    cy.contains('Pending Task');
    
    // Hide completed tasks
    cy.get('[data-testid="hide-completed-toggle"]').click();
    
    cy.contains('Pending Task');
    cy.contains('Completed Task').should('not.exist');
  });

  it('should highlight current date', () => {
    cy.visit('/calendar');
    
    const today = new Date().getDate();
    cy.get(`[data-testid="date-${today}"]`).should('have.class', 'current-date');
  });

  it('should create task from calendar date click', () => {
    cy.visit('/calendar');
    
    // Click on a date (15th of current month)
    cy.get('[data-testid="date-15"]').click();
    
    cy.get('[data-testid="task-dialog"]').should('be.visible');
    cy.get('[data-testid="task-due-date-input"]').should('contain.value', '15');
  });

  it('should navigate to task detail from calendar', () => {
    const taskDate = new Date();
    taskDate.setDate(15);
    
    cy.task('db:createTask', {
      id: 123,
      title: 'Navigable Task',
      description: 'Task for navigation test',
      due_date: taskDate.toISOString(),
      priority_id: 2,
      user_id: 1
    });

    cy.visit('/calendar');
    
    cy.get('[data-testid="calendar-task"]').first().click();
    cy.get('[data-testid="view-details-button"]').click();
    
    cy.url().should('include', '/tasks/123');
  });
});
