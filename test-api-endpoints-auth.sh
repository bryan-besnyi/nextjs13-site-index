#!/bin/bash

# Advanced API Endpoint Testing Script with Authentication Support
# Tests both public and admin endpoints with proper authentication

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Base URL (default to localhost, can be overridden)
BASE_URL="${API_BASE_URL:-http://localhost:3000}"

# Authentication token (can be set via environment variable)
AUTH_TOKEN="${API_AUTH_TOKEN:-}"

# Test results counters
PASSED=0
FAILED=0
TOTAL=0

# Function to get authentication cookie/token
get_auth_token() {
    echo -e "${CYAN}Attempting to get authentication token...${NC}"
    
    # First, try to get CSRF token
    local csrf_response=$(curl -s "$BASE_URL/api/csrf-token")
    local csrf_token=$(echo "$csrf_response" | jq -r '.token' 2>/dev/null)
    
    if [ -n "$csrf_token" ]; then
        echo -e "${GREEN}✓ CSRF token obtained${NC}"
    else
        echo -e "${YELLOW}⚠ Could not obtain CSRF token${NC}"
    fi
    
    # In a real scenario, you would authenticate here
    # For now, we'll check if AUTH_TOKEN is provided
    if [ -n "$AUTH_TOKEN" ]; then
        echo -e "${GREEN}✓ Using provided AUTH_TOKEN${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ No AUTH_TOKEN provided - admin endpoints will return 401${NC}"
        return 1
    fi
}

# Function to print colored output
print_status() {
    local status=$1
    local endpoint=$2
    local expected=$3
    local actual=$4
    local response_time=$5
    local response_body=$6
    
    ((TOTAL++))
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✓${NC} $endpoint - Expected: $expected, Got: $actual (${response_time}ms)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $endpoint - Expected: $expected, Got: $actual (${response_time}ms)"
        ((FAILED++))
        # Show response body for failed tests
        if [ -n "$response_body" ] && [ "$response_body" != "null" ]; then
            echo -e "  ${YELLOW}Response:${NC} $response_body"
        fi
    fi
}

# Enhanced function to test endpoint with better error handling
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data="${4:-}"
    local use_auth="${5:-false}"
    
    local url="${BASE_URL}${endpoint}"
    local start_time=$(date +%s%3N 2>/dev/null || echo "0")
    
    # Build curl command
    local curl_cmd="curl -s -o /tmp/api_response.json -w '%{http_code}' -X $method"
    
    # Add authentication if needed
    if [ "$use_auth" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    # Add cookie jar for session handling
    curl_cmd="$curl_cmd -c /tmp/cookies.txt -b /tmp/cookies.txt"
    
    # Add content-type for POST/PUT requests
    if [ "$method" != "GET" ] && [ "$method" != "HEAD" ] && [ "$method" != "DELETE" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    fi
    
    # Add data if provided
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # Execute request
    local http_status=$(eval "$curl_cmd '$url'" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N 2>/dev/null || echo "0")
    local response_time=$((end_time - start_time))
    
    # Get response body for error reporting
    local response_body=""
    if [ -f /tmp/api_response.json ] && [ -s /tmp/api_response.json ]; then
        response_body=$(jq -c . /tmp/api_response.json 2>/dev/null || cat /tmp/api_response.json 2>/dev/null | head -c 100)
    fi
    
    # Check if response is JSON (for non-HEAD requests)
    local is_json="false"
    if [ "$method" != "HEAD" ] && [ -f /tmp/api_response.json ] && [ -s /tmp/api_response.json ]; then
        if jq . /tmp/api_response.json >/dev/null 2>&1; then
            is_json="true"
        fi
    fi
    
    # Print result
    print_status "$status" "$method $endpoint" "$expected_status" "$http_status" "$response_time" "$response_body"
    
    # Additional validation
    if [ "$http_status" = "200" ] && [ "$method" != "HEAD" ] && [ "$is_json" = "false" ]; then
        echo -e "  ${YELLOW}⚠ Warning: Response is not valid JSON${NC}"
    fi
    
    # Check for 500 errors specifically
    if [[ "$http_status" =~ ^5[0-9][0-9]$ ]]; then
        echo -e "  ${RED}⚠ SERVER ERROR DETECTED!${NC}"
    fi
}

# Function to test rate limiting
test_rate_limiting() {
    echo -e "${YELLOW}Testing rate limiting...${NC}"
    
    local endpoint="/api/indexItems"
    local requests=25
    local success_count=0
    local rate_limited_count=0
    
    for i in $(seq 1 $requests); do
        local http_status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL$endpoint")
        if [ "$http_status" = "200" ]; then
            ((success_count++))
        elif [ "$http_status" = "429" ]; then
            ((rate_limited_count++))
        fi
        # Small delay to avoid overwhelming the server
        sleep 0.1
    done
    
    echo -e "  Requests sent: $requests"
    echo -e "  Successful: $success_count"
    echo -e "  Rate limited (429): $rate_limited_count"
    
    if [ $rate_limited_count -gt 0 ]; then
        echo -e "  ${GREEN}✓ Rate limiting is working${NC}"
    else
        echo -e "  ${YELLOW}⚠ No rate limiting detected${NC}"
    fi
}

# Function to test concurrent requests
test_concurrent_requests() {
    echo -e "${YELLOW}Testing concurrent requests...${NC}"
    
    local endpoint="/api/indexItems"
    local concurrent=10
    
    echo -e "  Sending $concurrent concurrent requests..."
    
    # Run concurrent requests in background
    for i in $(seq 1 $concurrent); do
        curl -s -o /tmp/concurrent_$i.json -w '%{http_code}\n' "$BASE_URL$endpoint" > /tmp/concurrent_$i.status &
    done
    
    # Wait for all requests to complete
    wait
    
    # Check results
    local all_success=true
    for i in $(seq 1 $concurrent); do
        local status=$(cat /tmp/concurrent_$i.status 2>/dev/null)
        if [ "$status" != "200" ]; then
            all_success=false
            echo -e "  ${RED}Request $i failed with status: $status${NC}"
        fi
    done
    
    if [ "$all_success" = true ]; then
        echo -e "  ${GREEN}✓ All concurrent requests succeeded${NC}"
    else
        echo -e "  ${RED}✗ Some concurrent requests failed${NC}"
    fi
    
    # Cleanup
    rm -f /tmp/concurrent_*.json /tmp/concurrent_*.status
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Advanced API Endpoint Testing Script${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Try to get authentication
get_auth_token
echo ""

# ===== PUBLIC ENDPOINTS (No Auth Required) =====
echo -e "${YELLOW}Testing PUBLIC endpoints${NC}"
echo ""

# Health endpoint
test_endpoint "GET" "/api/health" "200"
test_endpoint "HEAD" "/api/health" "200"

# CSRF Token endpoint
test_endpoint "GET" "/api/csrf-token" "200"
test_endpoint "POST" "/api/csrf-token" "200"

# Index Items endpoints with various parameters
test_endpoint "GET" "/api/indexItems" "200"
test_endpoint "GET" "/api/indexItems?campus=College of San Mateo" "200"
test_endpoint "GET" "/api/indexItems?campus=Skyline College" "200"
test_endpoint "GET" "/api/indexItems?campus=Cañada College" "200"
test_endpoint "GET" "/api/indexItems?campus=District Office" "200"
test_endpoint "GET" "/api/indexItems?search=student" "200"
test_endpoint "GET" "/api/indexItems?search=faculty&campus=College of San Mateo" "200"
test_endpoint "GET" "/api/indexItems?letter=A" "200"
test_endpoint "GET" "/api/indexItems?letter=Z" "200"
test_endpoint "GET" "/api/indexItems?id=1" "200"
test_endpoint "GET" "/api/indexItems?limit=10&offset=0" "200"

# V2 endpoint
test_endpoint "GET" "/api/indexItems/v2" "200"
test_endpoint "GET" "/api/indexItems/v2?campus=CSM" "200"  # Test campus code

# Analytics tracking endpoint
test_endpoint "POST" "/api/analytics/track-click" "400" # Missing required fields
test_endpoint "POST" "/api/analytics/track-click" "400" '{"searchTerm":"test"}'  # Missing fields
test_endpoint "POST" "/api/analytics/track-click" "200" '{"searchTerm":"test","clickedItemId":1,"position":0}'

# Cache warmup endpoint (public for testing)
test_endpoint "GET" "/api/cache/warmup" "200"

# Metrics endpoint
test_endpoint "GET" "/api/metrics" "200"

echo ""

# ===== ADMIN ENDPOINTS (Auth Required) =====
echo -e "${YELLOW}Testing ADMIN endpoints without authentication${NC}"
echo ""

# These should all return 401 without auth
test_endpoint "GET" "/api/admin/cache" "401"
test_endpoint "POST" "/api/admin/cache/invalidate" "401"
test_endpoint "POST" "/api/admin/cache/warmup" "401"
test_endpoint "GET" "/api/admin/analytics/usage" "401"
test_endpoint "GET" "/api/admin/analytics/search" "401"
test_endpoint "GET" "/api/admin/system/settings" "401"
test_endpoint "GET" "/api/admin/system/environment" "401"
test_endpoint "GET" "/api/admin/system/backups" "401"
test_endpoint "POST" "/api/admin/system/backups" "401"
test_endpoint "GET" "/api/admin/performance" "401"
test_endpoint "GET" "/api/admin/performance/real-metrics" "401"
test_endpoint "GET" "/api/admin/activity" "401"
test_endpoint "GET" "/api/admin/alerts" "401"
test_endpoint "POST" "/api/admin/bulk" "401"
test_endpoint "GET" "/api/admin/link-check" "401"

if [ -n "$AUTH_TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}Testing ADMIN endpoints with authentication${NC}"
    echo ""
    
    # These should return 200 with valid auth
    test_endpoint "GET" "/api/admin/cache" "200" "" "true"
    test_endpoint "GET" "/api/admin/analytics/usage" "200" "" "true"
    test_endpoint "GET" "/api/admin/analytics/search" "200" "" "true"
    test_endpoint "GET" "/api/admin/system/settings" "200" "" "true"
    test_endpoint "GET" "/api/admin/system/environment" "200" "" "true"
    test_endpoint "GET" "/api/admin/system/backups" "200" "" "true"
    test_endpoint "GET" "/api/admin/performance" "200" "" "true"
    test_endpoint "GET" "/api/admin/performance/real-metrics" "200" "" "true"
    test_endpoint "GET" "/api/admin/activity" "200" "" "true"
    test_endpoint "GET" "/api/admin/alerts" "200" "" "true"
    test_endpoint "GET" "/api/admin/link-check" "200" "" "true"
fi

echo ""

# ===== ERROR HANDLING =====
echo -e "${YELLOW}Testing error handling${NC}"
echo ""

# Non-existent endpoints
test_endpoint "GET" "/api/nonexistent" "404"
test_endpoint "GET" "/api/admin/nonexistent" "404"

# Invalid methods
test_endpoint "POST" "/api/indexItems" "405"
test_endpoint "PUT" "/api/indexItems" "405"
test_endpoint "DELETE" "/api/indexItems" "405"
test_endpoint "PATCH" "/api/health" "405"

# Invalid data formats
test_endpoint "POST" "/api/analytics/track-click" "400" "not-json"
test_endpoint "POST" "/api/analytics/track-click" "400" '{'  # Malformed JSON

# SQL injection attempts (should be safely handled)
test_endpoint "GET" "/api/indexItems?search='; DROP TABLE indexitems; --" "200"
test_endpoint "GET" "/api/indexItems?id=1 OR 1=1" "200"

# XSS attempts (should be safely handled)
test_endpoint "GET" "/api/indexItems?search=<script>alert('xss')</script>" "200"

echo ""

# ===== PERFORMANCE TESTS =====
echo -e "${YELLOW}Performance and stress tests${NC}"
echo ""

# Test rate limiting
test_rate_limiting
echo ""

# Test concurrent requests
test_concurrent_requests
echo ""

# ===== CORS TESTING =====
echo -e "${YELLOW}Testing CORS headers${NC}"
echo ""

# Test CORS from allowed origin
for origin in "https://collegeofsanmateo.edu" "https://localhost:3000"; do
    response=$(curl -s -I -H "Origin: $origin" "$BASE_URL/api/indexItems" 2>/dev/null | grep -i "access-control-allow-origin" || echo "No CORS header")
    echo "  Origin $origin: $response"
done

echo ""

# ===== SUMMARY =====
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Cleanup
rm -f /tmp/api_response.json /tmp/cookies.txt

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi