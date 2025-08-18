#!/bin/bash

# Quick API Testing Script
# Focuses on essential endpoint tests to verify no 500 errors

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Base URL
BASE_URL="${API_BASE_URL:-http://localhost:3000}"

echo -e "${BLUE}Quick API Test - Checking for server errors${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# Track any 500 errors
ERRORS_FOUND=0
TOTAL_TESTS=0

# Function to test endpoint
check_endpoint() {
    local method=$1
    local endpoint=$2
    local data="${3:-}"
    
    ((TOTAL_TESTS++))
    
    local url="${BASE_URL}${endpoint}"
    local curl_opts="-s -o /tmp/response.json -w '%{http_code}'"
    
    if [ -n "$data" ]; then
        curl_opts="$curl_opts -H 'Content-Type: application/json' -d '$data'"
    fi
    
    local status=$(eval "curl $curl_opts -X $method '$url'")
    
    if [[ "$status" =~ ^5[0-9][0-9]$ ]]; then
        echo -e "${RED}✗ $method $endpoint - Status: $status (SERVER ERROR!)${NC}"
        if [ -f /tmp/response.json ]; then
            echo -e "  Error: $(cat /tmp/response.json | jq -r '.error // .message // "Unknown"' 2>/dev/null || echo "Could not parse error")"
        fi
        ((ERRORS_FOUND++))
    elif [ "$status" = "000" ]; then
        echo -e "${RED}✗ $method $endpoint - Connection failed!${NC}"
        ((ERRORS_FOUND++))
    else
        echo -e "${GREEN}✓ $method $endpoint - Status: $status${NC}"
    fi
}

# Test public endpoints
echo -e "${YELLOW}Public Endpoints:${NC}"
check_endpoint "GET" "/api/health"
check_endpoint "GET" "/api/indexItems"
check_endpoint "GET" "/api/indexItems?campus=College of San Mateo"
check_endpoint "GET" "/api/indexItems?search=test"
check_endpoint "GET" "/api/indexItems?letter=A"
check_endpoint "GET" "/api/indexItems/v2"
check_endpoint "GET" "/api/csrf-token"
check_endpoint "POST" "/api/analytics/track-click" '{"searchTerm":"test","clickedItemId":1,"position":0}'
check_endpoint "GET" "/api/cache/warmup"
check_endpoint "GET" "/api/metrics"

echo ""

# Test admin endpoints (expect 401s, but no 500s)
echo -e "${YELLOW}Admin Endpoints (expecting 401s):${NC}"
check_endpoint "GET" "/api/admin/cache"
check_endpoint "GET" "/api/admin/analytics/usage"
check_endpoint "GET" "/api/admin/system/settings"
check_endpoint "GET" "/api/admin/performance"
check_endpoint "GET" "/api/admin/activity"

echo ""

# Summary
echo -e "${BLUE}===============================${NC}"
if [ $ERRORS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No server errors found! ($TOTAL_TESTS tests)${NC}"
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS_FOUND server errors out of $TOTAL_TESTS tests${NC}"
    exit 1
fi