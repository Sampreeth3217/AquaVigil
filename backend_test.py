#!/usr/bin/env python3
"""
AquaVIGIL Backend API Testing Suite
Tests all API endpoints for the water monitoring system
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class AquaVIGILAPITester:
    def __init__(self, base_url="https://220f17ea-fd27-4497-ba95-1b5bee4429aa.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_endpoint(self, name: str, endpoint: str, method: str = "GET", 
                     expected_status: int = 200, data: Dict = None) -> tuple:
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except json.JSONDecodeError:
                    self.log_test(name, False, f"Invalid JSON response, Status: {response.status_code}")
                    return False, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, data = self.test_endpoint("Root Endpoint", "/")
        if success:
            assert "AquaVIGIL API" in data.get("message", "")
            assert data.get("status") == "active"
            print(f"   📋 API Version: {data.get('version', 'Unknown')}")

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, data = self.test_endpoint("Health Check", "/api/health")
        if success:
            assert data.get("status") == "healthy"
            assert "modules_count" in data
            assert "active_modules" in data
            print(f"   📊 Modules: {data.get('modules_count', 0)}, Active: {data.get('active_modules', 0)}")

    def test_modules_endpoint(self):
        """Test get all modules endpoint"""
        success, data = self.test_endpoint("Get All Modules", "/api/modules")
        if success:
            assert isinstance(data, list)
            assert len(data) > 0
            
            # Validate module structure
            module = data[0]
            required_fields = ["id", "name", "location", "coordinates", "ph", "tds", 
                             "water_flow", "water_level", "temperature", "status"]
            
            for field in required_fields:
                assert field in module, f"Missing field: {field}"
            
            print(f"   📍 Found {len(data)} modules")
            for mod in data:
                print(f"      - {mod['name']} ({mod['status']})")
            
            return data
        return []

    def test_individual_module_endpoints(self, modules):
        """Test individual module endpoints"""
        if not modules:
            self.log_test("Individual Module Tests", False, "No modules to test")
            return

        for module in modules[:2]:  # Test first 2 modules
            module_id = module["id"]
            success, data = self.test_endpoint(
                f"Get Module {module_id}", 
                f"/api/modules/{module_id}"
            )
            
            if success:
                assert data["id"] == module_id
                assert "ph" in data
                assert "tds" in data
                print(f"   🔍 {data['name']}: pH={data['ph']}, TDS={data['tds']}")

    def test_module_history_endpoint(self):
        """Test module history endpoint"""
        success, data = self.test_endpoint("Module History", "/api/modules/sensors1/history")
        if success:
            assert "module_id" in data
            assert "history" in data
            assert isinstance(data["history"], list)
            print(f"   📈 History points: {len(data['history'])}")

    def test_statistics_endpoint(self):
        """Test statistics endpoint"""
        success, data = self.test_endpoint("System Statistics", "/api/statistics")
        if success:
            required_stats = ["total_modules", "active_modules", "maintenance_modules",
                            "total_flow_rate", "average_ph", "average_tds", 
                            "average_temperature", "regions_covered", "uptime_percentage"]
            
            for stat in required_stats:
                assert stat in data, f"Missing statistic: {stat}"
            
            print(f"   📊 Stats: {data['total_modules']} modules, {data['active_modules']} active")
            print(f"   💧 Avg pH: {data['average_ph']}, Avg TDS: {data['average_tds']}")

    def test_map_data_endpoint(self):
        """Test map data endpoint"""
        success, data = self.test_endpoint("Map Data", "/api/map-data")
        if success:
            assert "modules" in data
            assert isinstance(data["modules"], list)
            
            for module in data["modules"]:
                assert "coordinates" in module
                assert len(module["coordinates"]) == 2
                assert "status" in module
            
            print(f"   🗺️  Map modules: {len(data['modules'])}")

    def test_alerts_endpoint(self):
        """Test alerts endpoint"""
        success, data = self.test_endpoint("System Alerts", "/api/alerts")
        if success:
            assert "alerts" in data
            assert "count" in data
            assert isinstance(data["alerts"], list)
            print(f"   🚨 Active alerts: {data['count']}")

    def test_contact_endpoint(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "technical",
            "message": "This is a test message from the API testing suite."
        }
        
        success, data = self.test_endpoint(
            "Contact Form Submission", 
            "/api/contact", 
            method="POST", 
            expected_status=201,
            data=contact_data
        )
        
        if success:
            assert "status" in data
            assert data["status"] == "received"
            assert "id" in data
            print(f"   📧 Contact form submitted successfully")

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        # Test 404 for non-existent module
        success, _ = self.test_endpoint(
            "Invalid Module ID", 
            "/api/modules/nonexistent", 
            expected_status=404
        )
        
        # Test 404 for non-existent endpoint
        success, _ = self.test_endpoint(
            "Invalid Endpoint", 
            "/api/invalid-endpoint", 
            expected_status=404
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🌊 Starting AquaVIGIL API Testing Suite")
        print("=" * 50)
        
        try:
            # Basic connectivity tests
            self.test_root_endpoint()
            self.test_health_endpoint()
            
            # Core functionality tests
            modules = self.test_modules_endpoint()
            self.test_individual_module_endpoints(modules)
            self.test_module_history_endpoint()
            self.test_statistics_endpoint()
            self.test_map_data_endpoint()
            self.test_alerts_endpoint()
            
            # Form submission test
            self.test_contact_endpoint()
            
            # Error handling tests
            self.test_invalid_endpoints()
            
        except Exception as e:
            print(f"❌ Critical error during testing: {str(e)}")
            self.log_test("Critical Error", False, str(e))

        # Print final results
        print("\n" + "=" * 50)
        print("🏁 TEST RESULTS SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main test execution"""
    tester = AquaVIGILAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())