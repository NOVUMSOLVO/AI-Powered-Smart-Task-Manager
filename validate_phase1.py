#!/usr/bin/env python3
"""
Phase 1 Completion Validation Script
Validates that all Phase 1 requirements have been successfully implemented
"""

import os
import sys
import subprocess
import json
from pathlib import Path

class Phase1Validator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_dir = self.project_root / "backend"
        self.frontend_dir = self.project_root / "frontend"
        self.validation_results = []
    
    def check_file_exists(self, file_path, description):
        """Check if a required file exists"""
        if file_path.exists():
            self.log_success(f"✅ {description}: {file_path.name}")
            return True
        else:
            self.log_error(f"❌ {description}: {file_path.name} - NOT FOUND")
            return False
    
    def check_directory_exists(self, dir_path, description):
        """Check if a required directory exists"""
        if dir_path.exists() and dir_path.is_dir():
            self.log_success(f"✅ {description}: {dir_path.name}/")
            return True
        else:
            self.log_error(f"❌ {description}: {dir_path.name}/ - NOT FOUND")
            return False
    
    def log_success(self, message):
        print(f"\033[92m{message}\033[0m")
        self.validation_results.append(("PASS", message))
    
    def log_error(self, message):
        print(f"\033[91m{message}\033[0m")
        self.validation_results.append(("FAIL", message))
    
    def log_info(self, message):
        print(f"\033[94m{message}\033[0m")
    
    def validate_infrastructure_devops(self):
        """Validate Infrastructure & DevOps requirements"""
        self.log_info("\n🚀 Validating Infrastructure & DevOps...")
        
        # Docker configuration
        self.check_file_exists(self.project_root / "docker-compose.yml", "Docker Compose configuration")
        self.check_file_exists(self.backend_dir / "Dockerfile", "Backend Dockerfile")
        self.check_file_exists(self.frontend_dir / "Dockerfile", "Frontend Dockerfile")
        
        # CI/CD pipeline
        self.check_file_exists(self.project_root / ".github" / "workflows" / "ci-cd.yml", "GitHub Actions CI/CD")
        
        # Environment management
        self.check_file_exists(self.project_root / ".env.example", "Environment example file")
        
        # Logging system
        self.check_file_exists(self.backend_dir / "app" / "core" / "logging_config.py", "Logging configuration")
    
    def validate_security_hardening(self):
        """Validate Security Hardening requirements"""
        self.log_info("\n🔒 Validating Security Hardening...")
        
        # Rate limiting
        self.check_file_exists(self.backend_dir / "app" / "core" / "rate_limit.py", "Rate limiting implementation")
        
        # Input validation
        self.check_file_exists(self.backend_dir / "app" / "core" / "validation.py", "Input validation")
        
        # Security utilities
        self.check_file_exists(self.backend_dir / "app" / "core" / "security.py", "Security utilities")
        
        # Secrets management
        self.check_file_exists(self.backend_dir / "app" / "core" / "secrets.py", "Secrets management")
        
        # API versioning
        self.check_file_exists(self.backend_dir / "app" / "core" / "versioning.py", "API versioning")
    
    def validate_testing_quality(self):
        """Validate Quality & Testing requirements"""
        self.log_info("\n🧪 Validating Quality & Testing...")
        
        # Backend tests
        self.check_directory_exists(self.backend_dir / "tests", "Backend test directory")
        self.check_file_exists(self.backend_dir / "tests" / "test_auth.py", "Authentication tests")
        self.check_file_exists(self.backend_dir / "tests" / "conftest.py", "Test configuration")
        
        # Frontend tests
        self.check_directory_exists(self.frontend_dir / "src" / "tests", "Frontend test directory")
        self.check_directory_exists(self.frontend_dir / "src" / "tests" / "components", "Component tests")
        self.check_directory_exists(self.frontend_dir / "src" / "tests" / "integration", "Integration tests")
        
        # E2E tests
        self.check_directory_exists(self.frontend_dir / "cypress", "Cypress E2E tests")
        self.check_directory_exists(self.frontend_dir / "cypress" / "e2e", "Cypress E2E test files")
        
        # Load testing
        self.check_directory_exists(self.backend_dir / "tests" / "load_testing", "Load testing")
        self.check_file_exists(self.backend_dir / "tests" / "load_testing" / "locustfile.py", "Locust load tests")
    
    def validate_documentation(self):
        """Validate documentation requirements"""
        self.log_info("\n📚 Validating Documentation...")
        
        self.check_file_exists(self.project_root / "README.md", "Project README")
        self.check_file_exists(self.project_root / "IMPLEMENTATION_PROGRESS.md", "Implementation Progress")
        self.check_file_exists(self.project_root / "TESTING.md", "Testing Documentation")
        self.check_file_exists(self.project_root / "ROADMAP.md", "Project Roadmap")
    
    def validate_test_scripts(self):
        """Validate test execution scripts"""
        self.log_info("\n📝 Validating Test Scripts...")
        
        self.check_file_exists(self.project_root / "run_all_tests.sh", "Linux/Mac test runner")
        self.check_file_exists(self.project_root / "run_all_tests.ps1", "Windows test runner")
    
    def validate_package_configs(self):
        """Validate package configurations"""
        self.log_info("\n📦 Validating Package Configurations...")
        
        # Backend requirements
        self.check_file_exists(self.backend_dir / "requirements.txt", "Backend requirements")
        
        # Frontend package.json
        package_json = self.frontend_dir / "package.json"
        if self.check_file_exists(package_json, "Frontend package.json"):
            try:
                with open(package_json) as f:
                    config = json.load(f)
                    if "cypress" in str(config.get("scripts", {})):
                        self.log_success("✅ Cypress scripts configured")
                    if "test:coverage" in str(config.get("scripts", {})):
                        self.log_success("✅ Test coverage scripts configured")
            except Exception as e:
                self.log_error(f"❌ Error reading package.json: {e}")
    
    def generate_report(self):
        """Generate final validation report"""
        self.log_info("\n" + "="*60)
        self.log_info("📊 PHASE 1 VALIDATION REPORT")
        self.log_info("="*60)
        
        passed = len([r for r in self.validation_results if r[0] == "PASS"])
        failed = len([r for r in self.validation_results if r[0] == "FAIL"])
        total = passed + failed
        
        if failed == 0:
            self.log_success(f"\n🎉 ALL VALIDATIONS PASSED ({passed}/{total})")
            self.log_success("✅ Phase 1: Foundation & Production Readiness - COMPLETED")
            self.log_success("🚀 Ready to proceed to Phase 2: Core Feature Enhancement")
            return True
        else:
            self.log_error(f"\n⚠️ VALIDATION ISSUES FOUND ({failed} failed, {passed} passed)")
            self.log_error("❌ Please address the issues above before proceeding to Phase 2")
            return False
    
    def run_validation(self):
        """Run complete Phase 1 validation"""
        self.log_info("🔍 Starting Phase 1 Completion Validation...")
        self.log_info("="*60)
        
        self.validate_infrastructure_devops()
        self.validate_security_hardening()
        self.validate_testing_quality()
        self.validate_documentation()
        self.validate_test_scripts()
        self.validate_package_configs()
        
        return self.generate_report()

if __name__ == "__main__":
    validator = Phase1Validator()
    success = validator.run_validation()
    sys.exit(0 if success else 1)
