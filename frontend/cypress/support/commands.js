// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command for UI testing
Cypress.Commands.add('login', (username = 'testuser', password = 'password123') => {
  cy.visit('/');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for successful login
  cy.url().should('include', '/dashboard');
});

// Login via API (faster for setup)
Cypress.Commands.add('loginAPI', (username = 'testuser', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/token`,
    form: true,
    body: {
      username,
      password
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.access_token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Command to create a task via API
Cypress.Commands.add('createTask', (taskData = {}) => {
  const token = window.localStorage.getItem('token');
  
  const defaultTask = {
    title: 'Test Task',
    description: 'This is a test task created via API',
    due_date: new Date().toISOString(),
    priority_id: 2
  };
  
  const task = { ...defaultTask, ...taskData };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/tasks`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: task
  });
});

// Fill task form helper
Cypress.Commands.add('fillTaskForm', (taskData) => {
  if (taskData.title) {
    cy.get('[data-testid="task-title-input"]').clear().type(taskData.title);
  }
  if (taskData.description) {
    cy.get('[data-testid="task-description-input"]').clear().type(taskData.description);
  }
  if (taskData.dueDate) {
    cy.get('[data-testid="task-due-date-input"]').clear().type(taskData.dueDate);
  }
  if (taskData.priority) {
    cy.get('[data-testid="task-priority-select"]').select(taskData.priority);
  }
});

// Database tasks for testing
Cypress.Commands.add('task', (name, arg) => {
  return cy.request({
    method: 'POST',
    url: '/__cypress__/tasks',
    body: { name, arg }
  });
});

// Delete all tasks for cleanup
Cypress.Commands.add('deleteAllTasks', () => {
  const token = localStorage.getItem('token');
  
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/tasks`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then((response) => {
    response.body.forEach((task) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/tasks/${task.id}`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    });
  });
});

// Fill task form helper
Cypress.Commands.add('fillTaskForm', (taskData) => {
  if (taskData.title) {
    cy.get('[data-testid="task-title-input"]').clear().type(taskData.title);
  }
  if (taskData.description) {
    cy.get('[data-testid="task-description-input"]').clear().type(taskData.description);
  }
  if (taskData.dueDate) {
    cy.get('[data-testid="task-due-date-input"]').clear().type(taskData.dueDate);
  }
  if (taskData.priority) {
    cy.get('[data-testid="task-priority-select"]').select(taskData.priority);
  }
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});
