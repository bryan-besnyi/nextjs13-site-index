#!/bin/bash

# CI/CD API Testing Script
# Designed for automated testing in CI/CD pipelines
# Returns proper exit codes and generates test reports

set -e  # Exit on first error

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-console}"  # console, json, junit
OUTPUT_FILE="${OUTPUT_FILE:-api-test-results.json}"
TIMEOUT="${TIMEOUT:-30}"

# Test results
declare -A test_results
test_count=0
pass_count=0
fail_count=0
start_time=$(date +%s)

# Function to output in different formats
output_result() {
    local test_name=$1
    local status=$2
    local message=$3
    local duration=$4
    
    case "$OUTPUT_FORMAT" in
        "json")
            if [ ! -f "$OUTPUT_FILE" ]; then
                echo '{"tests":[' > "$OUTPUT_FILE"
            else
                echo ',' >> "$OUTPUT_FILE"
            fi
            cat >> "$OUTPUT_FILE" <<EOF
{
  "name": "$test_name",
  "status": "$status",
  "message": "$message",
  "duration": $duration
}
EOF
            ;;
        "junit")
            # JUnit XML format for CI tools
            if [ ! -f "$OUTPUT_FILE" ]; then
                cat > "$OUTPUT_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="API Tests" tests="0" failures="0" time="0">
EOF
            fi
            ;;
        *)
            # Console output
            if [ "$status" = "passed" ]; then
                echo "✓ $test_name - $message (${duration}ms)"
            else
                echo "✗ $test_name - $message (${duration}ms)"
            fi
            ;;
    esac
}

# Function to test endpoint
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data="${5:-}"
    
    ((test_count++))
    local url="${BASE_URL}${endpoint}"
    local start=$(date +%s%3N)
    
    # Build curl command
    local curl_cmd="curl -s -o /tmp/test_response.json -w '%{http_code}' --max-time $TIMEOUT -X $method"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # Execute test
    local actual_status=$(eval "$curl_cmd '$url'" 2>/dev/null || echo "000")
    local end=$(date +%s%3N)
    local duration=$((end - start))
    
    # Check result
    if [ "$actual_status" = "$expected_status" ]; then
        ((pass_count++))
        output_result "$test_name" "passed" "Expected $expected_status, got $actual_status" "$duration"
        test_results["$test_name"]="passed"
    else
        ((fail_count++))
        local error_msg="Expected $expected_status, got $actual_status"
        if [ -f /tmp/test_response.json ] && [ -s /tmp/test_response.json ]; then
            local error_detail=$(jq -r '.error // .message // ""' /tmp/test_response.json 2>/dev/null)
            if [ -n "$error_detail" ]; then
                error_msg="$error_msg - $error_detail"
            fi
        fi
        output_result "$test_name" "failed" "$error_msg" "$duration"
        test_results["$test_name"]="failed"
    fi
    
    # Check for 5xx errors specifically
    if [[ "$actual_status" =~ ^5[0-9][0-9]$ ]]; then
        echo "ERROR: Server error detected in $test_name" >&2
        if [ "$CI" = "true" ]; then
            exit 1  # Fail fast in CI on server errors
        fi
    fi
}

# Initialize output file
case "$OUTPUT_FORMAT" in
    "json")
        echo '{"tests":[' > "$OUTPUT_FILE"
        ;;
    "junit")
        cat > "$OUTPUT_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="API Tests" tests="0" failures="0" time="0">
EOF
        ;;
esac

echo "Starting API tests..."
echo "Base URL: $BASE_URL"
echo ""

# Core functionality tests
test_api "health_check" "GET" "/api/health" "200"
test_api "health_check_head" "HEAD" "/api/health" "200"

# Public API tests
test_api "index_items_list" "GET" "/api/indexItems" "200"
test_api "index_items_campus_filter" "GET" "/api/indexItems?campus=College of San Mateo" "200"
test_api "index_items_search" "GET" "/api/indexItems?search=student" "200"
test_api "index_items_letter_filter" "GET" "/api/indexItems?letter=A" "200"
test_api "index_items_v2" "GET" "/api/indexItems/v2" "200"

# CSRF token
test_api "csrf_token_get" "GET" "/api/csrf-token" "200"
test_api "csrf_token_post" "POST" "/api/csrf-token" "200"

# Analytics
test_api "analytics_track_click" "POST" "/api/analytics/track-click" "200" '{"searchTerm":"test","clickedItemId":1,"position":0}'
test_api "analytics_track_click_invalid" "POST" "/api/analytics/track-click" "400" '{"invalid":"data"}'

# Cache and metrics
test_api "cache_warmup_status" "GET" "/api/cache/warmup" "200"
test_api "metrics" "GET" "/api/metrics" "200"

# Admin endpoints (should be protected)
test_api "admin_cache_unauthorized" "GET" "/api/admin/cache" "401"
test_api "admin_analytics_unauthorized" "GET" "/api/admin/analytics/usage" "401"
test_api "admin_system_unauthorized" "GET" "/api/admin/system/settings" "401"
test_api "admin_performance_unauthorized" "GET" "/api/admin/performance" "401"

# Error handling
test_api "not_found" "GET" "/api/nonexistent" "404"
test_api "method_not_allowed" "POST" "/api/indexItems" "405"

# Calculate test duration
end_time=$(date +%s)
total_duration=$((end_time - start_time))

# Finalize output files
case "$OUTPUT_FORMAT" in
    "json")
        cat >> "$OUTPUT_FILE" <<EOF
],
"summary": {
  "total": $test_count,
  "passed": $pass_count,
  "failed": $fail_count,
  "duration": $total_duration,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}}
EOF
        ;;
    "junit")
        cat >> "$OUTPUT_FILE" <<EOF
  </testsuite>
  <testsuite name="Summary" tests="$test_count" failures="$fail_count" time="$total_duration">
    <testcase name="Total Tests" time="0">
      <system-out>Total: $test_count, Passed: $pass_count, Failed: $fail_count</system-out>
    </testcase>
  </testsuite>
</testsuites>
EOF
        ;;
esac

# Summary
echo ""
echo "Test Summary:"
echo "============="
echo "Total tests: $test_count"
echo "Passed: $pass_count"
echo "Failed: $fail_count"
echo "Duration: ${total_duration}s"

# Exit with appropriate code
if [ $fail_count -gt 0 ]; then
    echo ""
    echo "TESTS FAILED!"
    exit 1
else
    echo ""
    echo "ALL TESTS PASSED!"
    exit 0
fi