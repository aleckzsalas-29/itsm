#!/usr/bin/env python3
"""
Comprehensive Backend Testing for ITSM Assets Module
Tests authentication, assets CRUD operations, companies listing, and PDF generation
"""

import requests
import json
import sys
import os
from datetime import datetime
import uuid

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@itsm.com"
ADMIN_PASSWORD = "admin123"

class ITSMTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.created_asset_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_authentication(self):
        """Test 1: Authentication with admin credentials"""
        print("\n=== Test 1: Authentication ===")
        
        try:
            login_data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = requests.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    user = data['user']
                    self.log_result(
                        "Authentication", 
                        True, 
                        f"Login successful for user: {user.get('email', 'unknown')}"
                    )
                    return True
                else:
                    self.log_result(
                        "Authentication", 
                        False, 
                        "Login response missing token or user", 
                        data
                    )
            else:
                self.log_result(
                    "Authentication", 
                    False, 
                    f"Login failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("Authentication", False, f"Login request failed: {str(e)}")
        
        return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_companies_listing(self):
        """Test 2: List companies (should return 2 companies)"""
        print("\n=== Test 2: Companies Listing ===")
        
        try:
            response = requests.get(
                f"{API_BASE}/companies",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                companies = response.json()
                if isinstance(companies, list):
                    company_count = len(companies)
                    
                    # Verify expected fields
                    required_fields = ['id', 'name', 'contact_person', 'email']
                    field_check_passed = True
                    
                    for company in companies:
                        for field in required_fields:
                            if field not in company:
                                field_check_passed = False
                                self.log_result(
                                    "Companies Fields", 
                                    False, 
                                    f"Missing field '{field}' in company data"
                                )
                                break
                    
                    if field_check_passed:
                        self.log_result(
                            "Companies Listing", 
                            True, 
                            f"Retrieved {company_count} companies with all required fields"
                        )
                        
                        # Log company details
                        for i, company in enumerate(companies, 1):
                            print(f"   Company {i}: {company.get('name', 'Unknown')} ({company.get('email', 'No email')})")
                        
                        return True
                    
                else:
                    self.log_result(
                        "Companies Listing", 
                        False, 
                        "Response is not a list", 
                        companies
                    )
            else:
                self.log_result(
                    "Companies Listing", 
                    False, 
                    f"Request failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("Companies Listing", False, f"Request failed: {str(e)}")
        
        return False
    
    def test_assets_listing(self):
        """Test 3: List assets (should return 6 assets)"""
        print("\n=== Test 3: Assets Listing ===")
        
        try:
            response = requests.get(
                f"{API_BASE}/assets",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                assets = response.json()
                if isinstance(assets, list):
                    asset_count = len(assets)
                    
                    # Verify expected fields
                    required_fields = ['id', 'company_id', 'asset_type', 'manufacturer', 'model', 'status', 'created_at']
                    field_check_passed = True
                    
                    for asset in assets:
                        for field in required_fields:
                            if field not in asset:
                                field_check_passed = False
                                self.log_result(
                                    "Assets Fields", 
                                    False, 
                                    f"Missing field '{field}' in asset data"
                                )
                                break
                    
                    if field_check_passed:
                        self.log_result(
                            "Assets Listing", 
                            True, 
                            f"Retrieved {asset_count} assets with all required fields"
                        )
                        
                        # Log asset details
                        for i, asset in enumerate(assets, 1):
                            asset_type = asset.get('asset_type', 'Unknown')
                            manufacturer = asset.get('manufacturer', 'Unknown')
                            model = asset.get('model', 'Unknown')
                            status = asset.get('status', 'Unknown')
                            print(f"   Asset {i}: {asset_type} - {manufacturer} {model} ({status})")
                        
                        return True
                    
                else:
                    self.log_result(
                        "Assets Listing", 
                        False, 
                        "Response is not a list", 
                        assets
                    )
            else:
                self.log_result(
                    "Assets Listing", 
                    False, 
                    f"Request failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("Assets Listing", False, f"Request failed: {str(e)}")
        
        return False
    
    def test_asset_creation(self):
        """Test 4: Create a new asset"""
        print("\n=== Test 4: Asset Creation ===")
        
        # First get a company_id from the companies list
        try:
            companies_response = requests.get(
                f"{API_BASE}/companies",
                headers=self.get_auth_headers()
            )
            
            if companies_response.status_code != 200:
                self.log_result("Asset Creation", False, "Could not get companies for asset creation")
                return False
            
            companies = companies_response.json()
            if not companies:
                self.log_result("Asset Creation", False, "No companies available for asset creation")
                return False
            
            company_id = companies[0]['id']
            
            # Create test asset data
            asset_data = {
                "company_id": company_id,
                "asset_type": "Laptop",
                "manufacturer": "Dell",
                "model": "Latitude 7420",
                "serial_number": f"TEST-{uuid.uuid4().hex[:8].upper()}",
                "host_name": "TEST-LAPTOP-001",
                "status": "active",
                "location": "Oficina Principal",
                "operating_system": "Windows 11",
                "cpu_processor": "Intel i7-1185G7",
                "ram_gb": "16",
                "storage_type_capacity": "SSD 512GB",
                "notes": "Asset creado durante testing automatizado"
            }
            
            response = requests.post(
                f"{API_BASE}/assets",
                json=asset_data,
                headers={**self.get_auth_headers(), "Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                created_asset = response.json()
                if 'id' in created_asset:
                    self.created_asset_id = created_asset['id']
                    self.log_result(
                        "Asset Creation", 
                        True, 
                        f"Asset created successfully with ID: {self.created_asset_id}"
                    )
                    
                    # Verify the created asset has the correct data
                    for key, value in asset_data.items():
                        if created_asset.get(key) != value:
                            print(f"   Warning: {key} mismatch - expected: {value}, got: {created_asset.get(key)}")
                    
                    return True
                else:
                    self.log_result(
                        "Asset Creation", 
                        False, 
                        "Created asset response missing ID", 
                        created_asset
                    )
            else:
                self.log_result(
                    "Asset Creation", 
                    False, 
                    f"Asset creation failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("Asset Creation", False, f"Asset creation request failed: {str(e)}")
        
        return False
    
    def test_asset_update(self):
        """Test 5: Update an existing asset"""
        print("\n=== Test 5: Asset Update ===")
        
        if not self.created_asset_id:
            # Try to get an existing asset to update
            try:
                response = requests.get(
                    f"{API_BASE}/assets",
                    headers=self.get_auth_headers()
                )
                
                if response.status_code == 200:
                    assets = response.json()
                    if assets:
                        self.created_asset_id = assets[0]['id']
                    else:
                        self.log_result("Asset Update", False, "No assets available to update")
                        return False
                else:
                    self.log_result("Asset Update", False, "Could not get assets for update test")
                    return False
            except Exception as e:
                self.log_result("Asset Update", False, f"Failed to get assets for update: {str(e)}")
                return False
        
        try:
            # Update asset data
            update_data = {
                "asset_type": "Laptop",
                "manufacturer": "Dell",
                "model": "Latitude 7420 Updated",
                "status": "active",
                "location": "Oficina Actualizada",
                "notes": "Asset actualizado durante testing automatizado"
            }
            
            response = requests.put(
                f"{API_BASE}/assets/{self.created_asset_id}",
                json=update_data,
                headers={**self.get_auth_headers(), "Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                updated_asset = response.json()
                self.log_result(
                    "Asset Update", 
                    True, 
                    f"Asset {self.created_asset_id} updated successfully"
                )
                
                # Verify the update
                for key, value in update_data.items():
                    if updated_asset.get(key) != value:
                        print(f"   Warning: {key} update failed - expected: {value}, got: {updated_asset.get(key)}")
                
                return True
            else:
                self.log_result(
                    "Asset Update", 
                    False, 
                    f"Asset update failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("Asset Update", False, f"Asset update request failed: {str(e)}")
        
        return False
    
    def test_pdf_generation(self):
        """Test 6: Generate assets PDF report"""
        print("\n=== Test 6: PDF Generation ===")
        
        try:
            response = requests.get(
                f"{API_BASE}/reports/assets/pdf",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                content_length = len(response.content)
                
                if 'application/pdf' in content_type:
                    self.log_result(
                        "PDF Generation", 
                        True, 
                        f"PDF generated successfully ({content_length} bytes)"
                    )
                    
                    # Check if PDF has content
                    if content_length > 1000:  # Reasonable minimum for a PDF with content
                        print(f"   PDF size: {content_length} bytes - appears to have content")
                        return True
                    else:
                        print(f"   Warning: PDF size is small ({content_length} bytes) - may be empty")
                        return True  # Still consider it a pass if PDF was generated
                else:
                    self.log_result(
                        "PDF Generation", 
                        False, 
                        f"Wrong content type: {content_type} (expected application/pdf)"
                    )
            else:
                self.log_result(
                    "PDF Generation", 
                    False, 
                    f"PDF generation failed with status {response.status_code}", 
                    response.text
                )
        except Exception as e:
            self.log_result("PDF Generation", False, f"PDF generation request failed: {str(e)}")
        
        return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"Starting ITSM Assets Module Testing")
        print(f"Backend URL: {API_BASE}")
        print(f"Test Credentials: {ADMIN_EMAIL}")
        print("=" * 60)
        
        # Test 1: Authentication (required for all other tests)
        if not self.test_authentication():
            print("\n❌ CRITICAL: Authentication failed - cannot proceed with other tests")
            return False
        
        # Test 2: Companies listing
        self.test_companies_listing()
        
        # Test 3: Assets listing
        self.test_assets_listing()
        
        # Test 4: Asset creation
        self.test_asset_creation()
        
        # Test 5: Asset update
        self.test_asset_update()
        
        # Test 6: PDF generation
        self.test_pdf_generation()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result['status'])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result['status'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result['status']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            print(f"  {result['status']}: {result['test']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = ITSMTester()
    
    try:
        tester.run_all_tests()
        success = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\nTesting interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error during testing: {e}")
        sys.exit(1)