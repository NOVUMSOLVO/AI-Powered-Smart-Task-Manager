"""
Load Testing Suite for AI-Powered Smart Task Manager API

This module provides comprehensive load testing scenarios for all API endpoints
using Locust framework to ensure the application can handle expected traffic loads.
"""

from locust import HttpUser, task, between
import json
import random
from datetime import datetime, timedelta


class TaskManagerUser(HttpUser):
    """
    Simulates a typical user of the Task Manager application
    """
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Called when a user starts - handles authentication"""
        self.login()
    
    def login(self):
        """Authenticate user and store token"""
        # Create a test user for load testing
        username = f"loadtest_user_{random.randint(1000, 9999)}"
        password = "LoadTest123!"
        email = f"{username}@loadtest.com"
        
        # Register user
        self.client.post("/api/v1/users/register", json={
            "username": username,
            "email": email,
            "password": password
        })
        
        # Login and get token
        response = self.client.post("/api/v1/auth/token", data={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def get_tasks(self):
        """Load test: Get all tasks for current user"""
        self.client.get("/api/v1/tasks", headers=self.headers)
    
    @task(2)
    def create_task(self):
        """Load test: Create a new task"""
        task_data = {
            "title": f"Load Test Task {random.randint(1, 1000)}",
            "description": f"Task created during load testing at {datetime.now()}",
            "due_date": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(),
            "priority_id": random.randint(1, 3),
            "is_completed": False
        }
        
        response = self.client.post("/api/v1/tasks", 
                                  json=task_data, 
                                  headers=self.headers)
        
        # Store task ID for future operations
        if response.status_code == 201:
            task_id = response.json()["id"]
            if not hasattr(self, 'created_tasks'):
                self.created_tasks = []
            self.created_tasks.append(task_id)
    
    @task(2)
    def get_task_details(self):
        """Load test: Get details of a specific task"""
        if hasattr(self, 'created_tasks') and self.created_tasks:
            task_id = random.choice(self.created_tasks)
            self.client.get(f"/api/v1/tasks/{task_id}", headers=self.headers)
    
    @task(1)
    def update_task(self):
        """Load test: Update an existing task"""
        if hasattr(self, 'created_tasks') and self.created_tasks:
            task_id = random.choice(self.created_tasks)
            update_data = {
                "title": f"Updated Task {random.randint(1, 1000)}",
                "description": f"Task updated during load testing at {datetime.now()}",
                "is_completed": random.choice([True, False])
            }
            
            self.client.put(f"/api/v1/tasks/{task_id}", 
                          json=update_data, 
                          headers=self.headers)
    
    @task(1)
    def get_priorities(self):
        """Load test: Get all priority levels"""
        self.client.get("/api/v1/priorities", headers=self.headers)
    
    @task(1)
    def get_ai_recommendations(self):
        """Load test: Get AI recommendations"""
        self.client.get("/api/v1/ai/recommendations", headers=self.headers)
    
    def on_stop(self):
        """Cleanup when user stops"""
        # Delete created tasks to prevent database bloat
        if hasattr(self, 'created_tasks'):
            for task_id in self.created_tasks:
                self.client.delete(f"/api/v1/tasks/{task_id}", headers=self.headers)


class AdminUser(HttpUser):
    """
    Simulates admin operations with higher privileges
    """
    wait_time = between(2, 5)
    weight = 1  # Lower weight means fewer admin users
    
    def on_start(self):
        """Admin user login"""
        # Use predefined admin credentials for load testing
        response = self.client.post("/api/v1/auth/token", data={
            "username": "admin_loadtest",
            "password": "AdminLoadTest123!"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(2)
    def get_all_users(self):
        """Load test: Get all users (admin endpoint)"""
        self.client.get("/api/v1/admin/users", headers=self.headers)
    
    @task(1)
    def get_system_stats(self):
        """Load test: Get system statistics"""
        self.client.get("/api/v1/admin/stats", headers=self.headers)


class AnonymousUser(HttpUser):
    """
    Simulates unauthenticated users trying to access the application
    """
    wait_time = between(3, 6)
    weight = 2  # Some users will be unauthenticated
    
    @task(3)
    def access_protected_endpoint(self):
        """Load test: Try to access protected endpoints without auth"""
        endpoints = [
            "/api/v1/tasks",
            "/api/v1/priorities",
            "/api/v1/ai/recommendations"
        ]
        endpoint = random.choice(endpoints)
        self.client.get(endpoint)
    
    @task(1)
    def try_invalid_login(self):
        """Load test: Attempt login with invalid credentials"""
        self.client.post("/api/v1/auth/token", data={
            "username": "invalid_user",
            "password": "invalid_password"
        })


class HighVolumeTaskUser(HttpUser):
    """
    Simulates users creating many tasks rapidly
    """
    wait_time = between(0.5, 1)  # Faster operations
    weight = 1  # Lower weight for high-volume users
    
    def on_start(self):
        """Setup for high-volume testing"""
        username = f"highvolume_user_{random.randint(1000, 9999)}"
        password = "HighVolume123!"
        email = f"{username}@highvolume.com"
        
        # Register and login
        self.client.post("/api/v1/users/register", json={
            "username": username,
            "email": email,
            "password": password
        })
        
        response = self.client.post("/api/v1/auth/token", data={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            self.created_tasks = []
        else:
            self.token = None
            self.headers = {}
    
    @task(5)
    def rapid_task_creation(self):
        """Load test: Create tasks rapidly"""
        for i in range(5):  # Create 5 tasks per execution
            task_data = {
                "title": f"Rapid Task {i} - {random.randint(1, 10000)}",
                "description": f"High volume task creation test",
                "due_date": (datetime.now() + timedelta(hours=random.randint(1, 72))).isoformat(),
                "priority_id": random.randint(1, 3),
                "is_completed": False
            }
            
            response = self.client.post("/api/v1/tasks", 
                                      json=task_data, 
                                      headers=self.headers)
            
            if response.status_code == 201:
                self.created_tasks.append(response.json()["id"])
    
    @task(2)
    def bulk_task_operations(self):
        """Load test: Perform bulk operations on tasks"""
        if len(self.created_tasks) >= 10:
            # Bulk complete tasks
            task_ids = random.sample(self.created_tasks, 5)
            for task_id in task_ids:
                self.client.put(f"/api/v1/tasks/{task_id}", 
                              json={"is_completed": True}, 
                              headers=self.headers)


# Custom load testing scenarios
class StressTestScenario(HttpUser):
    """
    Stress testing scenario with extreme loads
    """
    wait_time = between(0.1, 0.5)  # Very fast requests
    weight = 1
    
    def on_start(self):
        """Setup for stress testing"""
        self.login()
    
    def login(self):
        """Quick login for stress testing"""
        username = f"stress_user_{random.randint(10000, 99999)}"
        password = "StressTest123!"
        email = f"{username}@stress.com"
        
        self.client.post("/api/v1/users/register", json={
            "username": username,
            "email": email,
            "password": password
        })
        
        response = self.client.post("/api/v1/auth/token", data={
            "username": username,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task
    def stress_endpoints(self):
        """Stress test all endpoints rapidly"""
        endpoints = [
            ("/api/v1/tasks", "GET"),
            ("/api/v1/priorities", "GET"),
            ("/api/v1/ai/recommendations", "GET")
        ]
        
        endpoint, method = random.choice(endpoints)
        
        if method == "GET":
            self.client.get(endpoint, headers=self.headers)
        elif method == "POST" and "tasks" in endpoint:
            task_data = {
                "title": f"Stress Task {random.randint(1, 100000)}",
                "description": "Stress test task",
                "due_date": datetime.now().isoformat(),
                "priority_id": random.randint(1, 3)
            }
            self.client.post(endpoint, json=task_data, headers=self.headers)
