"""
Load Testing Configuration and Runner Script

This script provides easy configuration and execution of load tests
for the AI-Powered Smart Task Manager application.
"""

import subprocess
import sys
import time
import json
from pathlib import Path


class LoadTestRunner:
    """
    Manages and executes load testing scenarios
    """
    
    def __init__(self, host="http://localhost:8000", web_port=8089):
        self.host = host
        self.web_port = web_port
        self.test_dir = Path(__file__).parent
        
    def run_basic_load_test(self, users=10, spawn_rate=2, duration="5m"):
        """
        Run basic load test with normal user simulation
        
        Args:
            users: Number of concurrent users
            spawn_rate: Users spawned per second
            duration: Test duration (e.g., "5m", "30s", "1h")
        """
        print(f"🚀 Starting basic load test...")
        print(f"   Users: {users}")
        print(f"   Spawn Rate: {spawn_rate}/sec")
        print(f"   Duration: {duration}")
        print(f"   Target: {self.host}")
        
        cmd = [
            "locust",
            "-f", str(self.test_dir / "locustfile.py"),
            "--host", self.host,
            "--users", str(users),
            "--spawn-rate", str(spawn_rate),
            "--run-time", duration,
            "--headless",
            "--html", str(self.test_dir / "reports" / f"basic_load_test_{int(time.time())}.html"),
            "--csv", str(self.test_dir / "reports" / f"basic_load_test_{int(time.time())}")
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Basic load test completed successfully")
                self._parse_results(result.stdout)
            else:
                print("❌ Load test failed:")
                print(result.stderr)
        except FileNotFoundError:
            print("❌ Locust not found. Install with: pip install locust")
    
    def run_stress_test(self, users=50, spawn_rate=5, duration="10m"):
        """
        Run stress test with high load
        """
        print(f"🔥 Starting stress test...")
        print(f"   Users: {users}")
        print(f"   Spawn Rate: {spawn_rate}/sec")
        print(f"   Duration: {duration}")
        
        cmd = [
            "locust",
            "-f", str(self.test_dir / "locustfile.py"),
            "--host", self.host,
            "--users", str(users),
            "--spawn-rate", str(spawn_rate),
            "--run-time", duration,
            "--headless",
            "--html", str(self.test_dir / "reports" / f"stress_test_{int(time.time())}.html"),
            "--csv", str(self.test_dir / "reports" / f"stress_test_{int(time.time())}")
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Stress test completed successfully")
                self._parse_results(result.stdout)
            else:
                print("❌ Stress test failed:")
                print(result.stderr)
        except FileNotFoundError:
            print("❌ Locust not found. Install with: pip install locust")
    
    def run_spike_test(self, users=100, spawn_rate=20, duration="2m"):
        """
        Run spike test with sudden load increase
        """
        print(f"⚡ Starting spike test...")
        print(f"   Users: {users}")
        print(f"   Spawn Rate: {spawn_rate}/sec")
        print(f"   Duration: {duration}")
        
        cmd = [
            "locust",
            "-f", str(self.test_dir / "locustfile.py"),
            "--host", self.host,
            "--users", str(users),
            "--spawn-rate", str(spawn_rate),
            "--run-time", duration,
            "--headless",
            "--html", str(self.test_dir / "reports" / f"spike_test_{int(time.time())}.html"),
            "--csv", str(self.test_dir / "reports" / f"spike_test_{int(time.time())}")
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Spike test completed successfully")
                self._parse_results(result.stdout)
            else:
                print("❌ Spike test failed:")
                print(result.stderr)
        except FileNotFoundError:
            print("❌ Locust not found. Install with: pip install locust")
    
    def run_interactive_test(self):
        """
        Run interactive load test with web UI
        """
        print(f"🌐 Starting interactive load test...")
        print(f"   Web UI: http://localhost:{self.web_port}")
        print(f"   Target: {self.host}")
        print("   Open the web UI to configure and start tests")
        
        cmd = [
            "locust",
            "-f", str(self.test_dir / "locustfile.py"),
            "--host", self.host,
            "--web-port", str(self.web_port)
        ]
        
        try:
            subprocess.run(cmd)
        except KeyboardInterrupt:
            print("\n🛑 Interactive test stopped")
        except FileNotFoundError:
            print("❌ Locust not found. Install with: pip install locust")
    
    def run_all_scenarios(self):
        """
        Run all predefined test scenarios in sequence
        """
        print("🎯 Running complete load testing suite...")
        
        # Create reports directory
        reports_dir = self.test_dir / "reports"
        reports_dir.mkdir(exist_ok=True)
        
        scenarios = [
            ("Basic Load Test", self.run_basic_load_test, {"users": 10, "duration": "3m"}),
            ("Medium Load Test", self.run_basic_load_test, {"users": 25, "duration": "5m"}),
            ("Stress Test", self.run_stress_test, {"users": 50, "duration": "5m"}),
            ("Spike Test", self.run_spike_test, {"users": 100, "duration": "2m"})
        ]
        
        results = []
        
        for name, test_func, kwargs in scenarios:
            print(f"\n{'='*50}")
            print(f"Running: {name}")
            print(f"{'='*50}")
            
            start_time = time.time()
            try:
                test_func(**kwargs)
                status = "PASSED"
            except Exception as e:
                print(f"❌ {name} failed: {e}")
                status = "FAILED"
            
            duration = time.time() - start_time
            results.append({
                "name": name,
                "status": status,
                "duration": f"{duration:.2f}s"
            })
            
            # Brief pause between tests
            time.sleep(10)
        
        # Print summary
        print(f"\n{'='*50}")
        print("LOAD TESTING SUMMARY")
        print(f"{'='*50}")
        
        for result in results:
            status_emoji = "✅" if result["status"] == "PASSED" else "❌"
            print(f"{status_emoji} {result['name']}: {result['status']} ({result['duration']})")
    
    def _parse_results(self, output):
        """
        Parse and display test results
        """
        lines = output.split('\n')
        for line in lines:
            if 'requests/s' in line or 'failures/s' in line or 'response time' in line:
                print(f"   📊 {line.strip()}")
    
    def setup_test_environment(self):
        """
        Setup test environment and dependencies
        """
        print("🔧 Setting up load testing environment...")
        
        # Install locust if not available
        try:
            import locust
            print("✅ Locust already installed")
        except ImportError:
            print("📦 Installing Locust...")
            subprocess.run([sys.executable, "-m", "pip", "install", "locust"])
        
        # Create reports directory
        reports_dir = self.test_dir / "reports"
        reports_dir.mkdir(exist_ok=True)
        print(f"✅ Reports directory: {reports_dir}")
        
        # Create test configuration
        config = {
            "host": self.host,
            "web_port": self.web_port,
            "scenarios": {
                "basic": {"users": 10, "spawn_rate": 2, "duration": "5m"},
                "stress": {"users": 50, "spawn_rate": 5, "duration": "10m"},
                "spike": {"users": 100, "spawn_rate": 20, "duration": "2m"}
            }
        }
        
        config_file = self.test_dir / "load_test_config.json"
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Configuration saved: {config_file}")
        print("🚀 Load testing environment ready!")


def main():
    """
    Main execution function with CLI interface
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Load Testing for AI-Powered Smart Task Manager")
    parser.add_argument("--host", default="http://localhost:8000", help="Target host URL")
    parser.add_argument("--web-port", type=int, default=8089, help="Web UI port")
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Setup command
    subparsers.add_parser("setup", help="Setup test environment")
    
    # Basic test command
    basic_parser = subparsers.add_parser("basic", help="Run basic load test")
    basic_parser.add_argument("--users", type=int, default=10, help="Number of users")
    basic_parser.add_argument("--spawn-rate", type=int, default=2, help="Spawn rate per second")
    basic_parser.add_argument("--duration", default="5m", help="Test duration")
    
    # Stress test command
    stress_parser = subparsers.add_parser("stress", help="Run stress test")
    stress_parser.add_argument("--users", type=int, default=50, help="Number of users")
    stress_parser.add_argument("--spawn-rate", type=int, default=5, help="Spawn rate per second")
    stress_parser.add_argument("--duration", default="10m", help="Test duration")
    
    # Spike test command
    spike_parser = subparsers.add_parser("spike", help="Run spike test")
    spike_parser.add_argument("--users", type=int, default=100, help="Number of users")
    spike_parser.add_argument("--spawn-rate", type=int, default=20, help="Spawn rate per second")
    spike_parser.add_argument("--duration", default="2m", help="Test duration")
    
    # Interactive command
    subparsers.add_parser("interactive", help="Run interactive test with web UI")
    
    # All scenarios command
    subparsers.add_parser("all", help="Run all test scenarios")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    runner = LoadTestRunner(host=args.host, web_port=args.web_port)
    
    if args.command == "setup":
        runner.setup_test_environment()
    elif args.command == "basic":
        runner.run_basic_load_test(args.users, args.spawn_rate, args.duration)
    elif args.command == "stress":
        runner.run_stress_test(args.users, args.spawn_rate, args.duration)
    elif args.command == "spike":
        runner.run_spike_test(args.users, args.spawn_rate, args.duration)
    elif args.command == "interactive":
        runner.run_interactive_test()
    elif args.command == "all":
        runner.run_all_scenarios()


if __name__ == "__main__":
    main()
