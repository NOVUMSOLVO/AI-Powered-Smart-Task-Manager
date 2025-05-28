describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset database or use test data
    cy.task('db:reset');
  });

  it('should display login page by default', () => {
    cy.visit('/');
    cy.contains('Sign in');
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.visit('/');
    cy.get('[data-testid="login-button"]').click();
    
    cy.contains('Username is required');
    cy.contains('Password is required');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/');
    
    cy.get('[data-testid="username-input"]').type('invaliduser');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    cy.contains('Invalid credentials');
  });

  it('should successfully login with valid credentials', () => {
    // Create test user
    cy.task('db:createUser', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    });

    cy.visit('/');
    
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('testpassword123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back');
  });

  it('should navigate to registration page', () => {
    cy.visit('/');
    
    cy.get('[data-testid="register-link"]').click();
    
    cy.url().should('include', '/register');
    cy.contains('Sign up');
  });

  it('should successfully register a new user', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="password-input"]').type('newpassword123');
    cy.get('[data-testid="confirm-password-input"]').type('newpassword123');
    cy.get('[data-testid="register-button"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome');
  });

  it('should show password mismatch error', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="email-input"]').type('newuser@example.com');
    cy.get('[data-testid="username-input"]').type('newuser');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirm-password-input"]').type('password456');
    cy.get('[data-testid="register-button"]').click();
    
    cy.contains('Passwords do not match');
  });

  it('should logout successfully', () => {
    // Login first
    cy.login('testuser', 'testpassword123');
    
    cy.get('[data-testid="logout-button"]').click();
    
    cy.url().should('include', '/login');
    cy.contains('Sign in');
  });
});
