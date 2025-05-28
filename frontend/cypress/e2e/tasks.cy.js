describe('Task Management', () => {
  beforeEach(() => {
    cy.task('db:reset');
    cy.task('db:createUser', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    });
    cy.login('testuser', 'testpassword123');
  });

  it('should display empty task list initially', () => {
    cy.visit('/tasks');
    
    cy.contains('No tasks found');
    cy.get('[data-testid="add-task-button"]').should('be.visible');
  });

  it('should create a new task successfully', () => {
    cy.visit('/tasks');
    
    cy.get('[data-testid="add-task-button"]').click();
    
    cy.get('[data-testid="task-title-input"]').type('Complete project documentation');
    cy.get('[data-testid="task-description-input"]').type('Write comprehensive user guides and API documentation');
    cy.get('[data-testid="task-due-date-input"]').type('2025-06-01');
    cy.get('[data-testid="task-priority-select"]').select('High');
    
    cy.get('[data-testid="create-task-button"]').click();
    
    cy.contains('Complete project documentation');
    cy.contains('High');
    cy.get('[data-testid="task-dialog"]').should('not.exist');
  });

  it('should edit an existing task', () => {
    // Create a task first
    cy.task('db:createTask', {
      title: 'Original Task',
      description: 'Original description',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 2,
      user_id: 1
    });

    cy.visit('/tasks');
    
    cy.get('[data-testid="task-item"]').first().click();
    
    cy.url().should('match', /\/tasks\/\d+/);
    
    cy.get('[data-testid="edit-button"]').click();
    
    cy.get('[data-testid="task-title-input"]').clear().type('Updated Task Title');
    cy.get('[data-testid="task-description-input"]').clear().type('Updated description');
    
    cy.get('[data-testid="save-button"]').click();
    
    cy.contains('Updated Task Title');
    cy.contains('Updated description');
  });

  it('should mark task as completed', () => {
    cy.task('db:createTask', {
      title: 'Task to Complete',
      description: 'This task will be marked as completed',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 1,
      user_id: 1
    });

    cy.visit('/tasks');
    
    cy.get('[data-testid="task-checkbox"]').first().check();
    
    cy.get('[data-testid="task-item"]').first().should('have.class', 'completed');
    cy.get('[data-testid="task-checkbox"]').first().should('be.checked');
  });

  it('should delete a task', () => {
    cy.task('db:createTask', {
      title: 'Task to Delete',
      description: 'This task will be deleted',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 3,
      user_id: 1
    });

    cy.visit('/tasks');
    
    cy.get('[data-testid="task-item"]').first().click();
    
    cy.get('[data-testid="delete-button"]').click();
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    cy.url().should('include', '/tasks');
    cy.contains('No tasks found');
  });

  it('should filter tasks by priority', () => {
    // Create tasks with different priorities
    cy.task('db:createTask', {
      title: 'High Priority Task',
      description: 'Important task',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 1,
      user_id: 1
    });
    
    cy.task('db:createTask', {
      title: 'Low Priority Task',
      description: 'Less important task',
      due_date: '2025-06-02T12:00:00Z',
      priority_id: 3,
      user_id: 1
    });

    cy.visit('/tasks');
    
    // Filter by high priority
    cy.get('[data-testid="priority-filter"]').select('High');
    
    cy.contains('High Priority Task');
    cy.contains('Low Priority Task').should('not.exist');
    
    // Clear filter
    cy.get('[data-testid="priority-filter"]').select('All');
    
    cy.contains('High Priority Task');
    cy.contains('Low Priority Task');
  });

  it('should filter tasks by completion status', () => {
    cy.task('db:createTask', {
      title: 'Completed Task',
      description: 'This task is completed',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 2,
      is_completed: true,
      user_id: 1
    });
    
    cy.task('db:createTask', {
      title: 'Pending Task',
      description: 'This task is pending',
      due_date: '2025-06-02T12:00:00Z',
      priority_id: 2,
      is_completed: false,
      user_id: 1
    });

    cy.visit('/tasks');
    
    // Filter by completed tasks
    cy.get('[data-testid="status-filter"]').select('Completed');
    
    cy.contains('Completed Task');
    cy.contains('Pending Task').should('not.exist');
    
    // Filter by pending tasks
    cy.get('[data-testid="status-filter"]').select('Pending');
    
    cy.contains('Pending Task');
    cy.contains('Completed Task').should('not.exist');
  });

  it('should search tasks by title', () => {
    cy.task('db:createTask', {
      title: 'Documentation Task',
      description: 'Write documentation',
      due_date: '2025-06-01T12:00:00Z',
      priority_id: 2,
      user_id: 1
    });
    
    cy.task('db:createTask', {
      title: 'Bug Fix Task',
      description: 'Fix critical bug',
      due_date: '2025-06-02T12:00:00Z',
      priority_id: 1,
      user_id: 1
    });

    cy.visit('/tasks');
    
    cy.get('[data-testid="search-input"]').type('Documentation');
    
    cy.contains('Documentation Task');
    cy.contains('Bug Fix Task').should('not.exist');
    
    // Clear search
    cy.get('[data-testid="search-input"]').clear();
    
    cy.contains('Documentation Task');
    cy.contains('Bug Fix Task');
  });

  it('should validate required fields when creating task', () => {
    cy.visit('/tasks');
    
    cy.get('[data-testid="add-task-button"]').click();
    cy.get('[data-testid="create-task-button"]').click();
    
    cy.contains('Title is required');
    cy.contains('Description is required');
  });
});
