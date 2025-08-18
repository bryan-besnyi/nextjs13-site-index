#!/bin/bash

# API Endpoint Testing Script
# Tests both public and admin endpoints for proper response codes

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (default to localhost, can be overridden)
BASE_URL="${API_BASE_URL:-http://localhost:3000}"

# Test results counters
PASSED=0
FAILED=0
TOTAL=0

# Function to print colored output
print_status() {
    local status=$1
    local endpoint=$2
    local expected=$3
    local actual=$4
    local response_time=$5
    
    ((TOTAL++))
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✓${NC} $endpoint - Expected: $expected, Got: $actual (${response_time}ms)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $endpoint - Expected: $expected, Got: $actual (${response_time}ms)"
        ((FAILED++))
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data="${4:-}"
    local auth_header="${5:-}"
    
    local url="${BASE_URL}${endpoint}"
    local start_time=$(date +%s%3N)
    
    # Build curl command
    local curl_cmd="curl -s -o /tmp/api_response.json -w '%{http_code}' -X $method"
    
    # Add auth header if provided
    if [ -n "$auth_header" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: $auth_header'"
    fi
    
    # Add content-type for POST/PUT requests
    if [ "$method" != "GET" ] && [ "$method" != "HEAD" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    fi
    
    # Add data if provided
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    # Execute request
    local http_status=$(eval "$curl_cmd '$url'")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # Check if response is JSON (for non-HEAD requests)
    local is_json="false"
    if [ "$method" != "HEAD" ] && [ -f /tmp/api_response.json ] && [ -s /tmp/api_response.json ]; then
        if jq . /tmp/api_response.json >/dev/null 2>&1; then
            is_json="true"
        fi
    fi
    
    # Print result
    print_status "$status" "$method $endpoint" "$expected_status" "$http_status" "$response_time"
    
    # Additional validation for successful responses
    if [ "$http_status" = "200" ] && [ "$method" != "HEAD" ] && [ "$is_json" = "false" ]; then
        echo -e "  ${YELLOW}⚠ Warning: Response is not valid JSON${NC}"
    fi
    
    # Check for 500 errors specifically
    if [ "$http_status" = "500" ]; then
        echo -e "  ${RED}⚠ SERVER ERROR DETECTED!${NC}"
        if [ -f /tmp/api_response.json ]; then
            echo -e "  Response: $(cat /tmp/api_response.json | jq -r '.error // "No error message"' 2>/dev/null || cat /tmp/api_response.json)"
        fi
    fi
}

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}API Endpoint Testing Script${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# ===== PUBLIC ENDPOINTS =====
echo -e "${YELLOW}Testing PUBLIC endpoints (should be accessible without auth)${NC}"
echo ""

# Health endpoint
test_endpoint "GET" "/api/health" "200"
test_endpoint "HEAD" "/api/health" "200"

# Index Items endpoints
test_endpoint "GET" "/api/indexItems" "200"
test_endpoint "GET" "/api/indexItems?campus=College of San Mateo" "200"
test_endpoint "GET" "/api/indexItems?search=student" "200"
test_endpoint "GET" "/api/indexItems?letter=A" "200"
test_endpoint "GET" "/api/indexItems?id=1" "200"
test_endpoint "GET" "/api/indexItems?invalid_param=test" "200"  # Should still work
test_endpoint "POST" "/api/indexItems" "405"  # Method not allowed
test_endpoint "PUT" "/api/indexItems" "405"   # Method not allowed
test_endpoint "DELETE" "/api/indexItems" "405" # Method not allowed

# V2 endpoint
test_endpoint "GET" "/api/indexItems/v2" "200"
test_endpoint "GET" "/api/indexItems/v2?campus=Skyline College" "200"

# CSRF Token endpoint
test_endpoint "GET" "/api/csrf-token" "200"
test_endpoint "POST" "/api/csrf-token" "200"

# Analytics tracking endpoint
test_endpoint "POST" "/api/analytics/track-click" "400" # Missing required fields
test_endpoint "POST" "/api/analytics/track-click" "200" '{"searchTerm":"test","clickedItemId":1,"position":0}'

# Cache warmup endpoint (public for testing)
test_endpoint "GET" "/api/cache/warmup" "200"
test_endpoint "POST" "/api/cache/warmup" "200"

# Metrics endpoint
test_endpoint "GET" "/api/metrics" "200"

echo ""

# ===== ADMIN ENDPOINTS =====
echo -e "${YELLOW}Testing ADMIN endpoints (should return 401 without auth)${NC}"
echo ""

# Admin Cache endpoints
test_endpoint "GET" "/api/admin/cache" "401"
test_endpoint "POST" "/api/admin/cache/invalidate" "401"
test_endpoint "POST" "/api/admin/cache/warmup" "401"

# Admin Analytics endpoints
test_endpoint "GET" "/api/admin/analytics/usage" "401"
test_endpoint "GET" "/api/admin/analytics/search" "401"

# Admin System endpoints
test_endpoint "GET" "/api/admin/system/settings" "401"
test_endpoint "GET" "/api/admin/system/environment" "401"
test_endpoint "GET" "/api/admin/system/backups" "401"
test_endpoint "POST" "/api/admin/system/backups" "401"

# Admin Performance endpoints
test_endpoint "GET" "/api/admin/performance" "401"
test_endpoint "GET" "/api/admin/performance/real-metrics" "401"

# Admin Activity endpoint
test_endpoint "GET" "/api/admin/activity" "401"

# Admin Alerts endpoint
test_endpoint "GET" "/api/admin/alerts" "401"
test_endpoint "POST" "/api/admin/alerts" "401"

# Admin Bulk operations endpoint
test_endpoint "POST" "/api/admin/bulk" "401"

# Admin Link check endpoint
test_endpoint "GET" "/api/admin/link-check" "401"

echo ""

# ===== TEST WITH FAKE AUTH TOKEN =====
echo -e "${YELLOW}Testing ADMIN endpoints with fake auth (should still return 401)${NC}"
echo ""

FAKE_TOKEN="Bearer fake-token-12345"
test_endpoint "GET" "/api/admin/cache" "401" "" "$FAKE_TOKEN"
test_endpoint "GET" "/api/admin/analytics/usage" "401" "" "$FAKE_TOKEN"

echo ""

# ===== EDGE CASES AND ERROR HANDLING =====
echo -e "${YELLOW}Testing edge cases and error handling${NC}"
echo ""

# Non-existent endpoints
test_endpoint "GET" "/api/nonexistent" "404"
test_endpoint "GET" "/api/admin/nonexistent" "404"

# Invalid data formats
test_endpoint "POST" "/api/analytics/track-click" "400" "invalid-json"
test_endpoint "POST" "/api/analytics/track-click" "400" '{"invalid":"data"}'

# Large query parameters
LONG_SEARCH=$(printf 'a%.0s' {1..1000})
test_endpoint "GET" "/api/indexItems?search=$LONG_SEARCH" "200"

# Special characters in parameters
test_endpoint "GET" "/api/indexItems?search=test%20%26%20special%20chars" "200"
test_endpoint "GET" "/api/indexItems?campus=Cañada%20College" "200"

echo ""

# ===== PERFORMANCE TESTS =====
echo -e "${YELLOW}Running basic performance tests${NC}"
echo ""

# Test response times for main endpoints
echo "Testing response times (5 requests each):"
for i in {1..5}; do
    start_time=$(date +%s%3N)
    curl -s -o /dev/null "$BASE_URL/api/indexItems"
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    echo "  Request $i: ${response_time}ms"
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

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi