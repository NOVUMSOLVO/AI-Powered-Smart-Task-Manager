# Load Testing Guide

## Overview

This directory contains comprehensive load testing tools for the AI-Powered Smart Task Manager API. The tests simulate various user scenarios and traffic patterns to ensure the application performs well under different load conditions.

## Setup

1. **Install Dependencies**
   ```bash
   cd backend/tests/load_testing
   pip install -r requirements.txt
   ```

2. **Setup Test Environment**
   ```bash
   python run_load_tests.py setup
   ```

3. **Ensure Backend is Running**
   ```bash
   # Start the backend server
   cd backend/app
   uvicorn main:app --reload
   ```

## Running Tests

### Quick Start

Run basic load test with default settings:
```bash
python run_load_tests.py basic
```

### Available Test Scenarios

1. **Basic Load Test**
   - 10 concurrent users
   - Normal usage patterns
   - 5-minute duration
   ```bash
   python run_load_tests.py basic --users 10 --duration 5m
   ```

2. **Stress Test**
   - 50 concurrent users
   - High load simulation
   - 10-minute duration
   ```bash
   python run_load_tests.py stress --users 50 --duration 10m
   ```

3. **Spike Test**
   - 100 concurrent users
   - Sudden load increase
   - 2-minute duration
   ```bash
   python run_load_tests.py spike --users 100 --duration 2m
   ```

4. **Interactive Test**
   - Web UI for real-time monitoring
   - Custom configuration
   ```bash
   python run_load_tests.py interactive
   ```

5. **Complete Test Suite**
   - Runs all scenarios sequentially
   ```bash
   python run_load_tests.py all
   ```

### Custom Configuration

You can customize any test with additional parameters:

```bash
# Custom basic test
python run_load_tests.py basic --users 25 --spawn-rate 3 --duration 8m

# Custom stress test  
python run_load_tests.py stress --users 75 --spawn-rate 10 --duration 15m

# Different target host
python run_load_tests.py basic --host http://staging.example.com --users 20
```

## Test Scenarios

### TaskManagerUser (Weight: 3)
Simulates typical application usage:
- Authentication and session management
- Creating, reading, updating tasks
- Viewing priorities and AI recommendations
- Normal user behavior patterns

### AdminUser (Weight: 1)
Simulates administrative operations:
- Admin dashboard access
- User management operations
- System statistics retrieval
- Lower frequency, higher privilege operations

### AnonymousUser (Weight: 2)
Simulates unauthenticated traffic:
- Attempts to access protected endpoints
- Invalid login attempts
- Security boundary testing

### HighVolumeTaskUser (Weight: 1)
Simulates power users:
- Rapid task creation
- Bulk operations
- High-frequency API calls
- Database stress testing

### StressTestScenario (Weight: 1)
Extreme load conditions:
- Maximum request frequency
- Resource exhaustion testing
- Performance bottleneck identification

## Reports and Analysis

After each test run, detailed reports are generated in the `reports/` directory:

- **HTML Report**: Visual charts and statistics
- **CSV Data**: Raw performance data for analysis
- **Response Times**: Detailed latency measurements
- **Error Rates**: Failed request analysis

### Report Files

```
reports/
├── basic_load_test_[timestamp].html
├── basic_load_test_[timestamp]_stats.csv
├── basic_load_test_[timestamp]_failures.csv
├── stress_test_[timestamp].html
└── ...
```

## Performance Targets

### Expected Performance Benchmarks

1. **Response Times (95th percentile)**
   - GET /tasks: < 200ms
   - POST /tasks: < 300ms
   - PUT /tasks/{id}: < 250ms
   - DELETE /tasks/{id}: < 150ms
   - GET /priorities: < 100ms

2. **Throughput**
   - Minimum: 100 requests/second
   - Target: 500 requests/second
   - Peak: 1000 requests/second

3. **Error Rates**
   - < 0.1% for normal operations
   - < 1% during stress conditions
   - 0% for critical paths (auth, data integrity)

4. **Resource Usage**
   - CPU: < 80% under normal load
   - Memory: < 2GB for 50 concurrent users
   - Database connections: < 100 active

## Interpreting Results

### Key Metrics to Monitor

1. **Response Time**
   - Average: Overall system responsiveness
   - 95th percentile: User experience under load
   - Max: Worst-case scenarios

2. **Request Rate**
   - RPS (Requests Per Second): System throughput
   - Trends: Performance degradation patterns

3. **Error Rate**
   - 4xx errors: Client/validation issues
   - 5xx errors: Server/infrastructure problems
   - Connection errors: Network/capacity issues

4. **Concurrency**
   - Active users: Current load level
   - Queue times: Resource contention

### Warning Signs

- Response times > 1 second
- Error rates > 5%
- Memory usage trending upward
- Database connection pool exhaustion
- CPU usage > 90%

## Troubleshooting

### Common Issues

1. **High Response Times**
   - Check database query performance
   - Review N+1 query patterns
   - Analyze slow endpoints

2. **Memory Leaks**
   - Monitor object creation/destruction
   - Check connection pooling
   - Review caching strategies

3. **Database Bottlenecks**
   - Add database indexes
   - Optimize query patterns
   - Consider connection pooling

4. **Rate Limiting Triggered**
   - Adjust rate limits for testing
   - Use test-specific endpoints
   - Implement proper backoff

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_tasks_user_id ON tasks(user_id);
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);
   CREATE INDEX idx_tasks_priority_id ON tasks(priority_id);
   ```

2. **Caching Strategy**
   - Implement Redis for session storage
   - Cache priority data
   - Add response caching for read-heavy endpoints

3. **Connection Pooling**
   ```python
   # Optimize database pool settings
   DATABASE_POOL_SIZE = 20
   DATABASE_MAX_OVERFLOW = 30
   DATABASE_POOL_TIMEOUT = 30
   ```

## CI/CD Integration

Add load testing to your CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend/tests/load_testing
          pip install -r requirements.txt
      - name: Run load tests
        run: |
          cd backend/tests/load_testing
          python run_load_tests.py basic --users 10 --duration 2m
```

## Best Practices

1. **Test Environment**
   - Use dedicated test databases
   - Mirror production configuration
   - Isolate from development data

2. **Test Data**
   - Clean up test data after runs
   - Use realistic data volumes
   - Avoid impacting real users

3. **Monitoring**
   - Monitor system resources during tests
   - Log performance metrics
   - Set up alerts for critical thresholds

4. **Regular Testing**
   - Schedule regular load tests
   - Test before major releases
   - Monitor performance trends over time

## Advanced Usage

### Custom User Scenarios

Create custom user behaviors by extending the base classes:

```python
class CustomUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def custom_workflow(self):
        # Implement specific user journey
        pass
```

### Performance Profiling

Combine with profiling tools for detailed analysis:

```bash
# Profile during load test
python -m cProfile -o profile.stats run_load_tests.py basic

# Analyze results
python -c "import pstats; pstats.Stats('profile.stats').sort_stats('time').print_stats(20)"
```

### Database Load Testing

Test database performance independently:

```python
# Direct database load testing
from locust import events
import sqlalchemy

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    # Setup database connections
    pass

@events.test_stop.add_listener  
def on_test_stop(environment, **kwargs):
    # Cleanup and reporting
    pass
```
