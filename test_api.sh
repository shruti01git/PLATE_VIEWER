#!/bin/bash

# Multi-Camera Vehicle Intelligence System - API Test Script
# This script tests all API endpoints

API_URL="http://localhost:8000/api"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Multi-Camera Vehicle Intelligence System - API Testing    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to print test result
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -e "${BLUE}Testing: ${description}${NC}"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
    fi
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "  ${GREEN}✓ Status: $http_code${NC}"
    else
        echo -e "  ${RED}✗ Status: $http_code${NC}"
    fi
    
    echo "  Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
}

# Check if API is running
echo -e "${YELLOW}Checking API connection...${NC}"
if ! curl -s "$API_URL/health" > /dev/null; then
    echo -e "${RED}✗ Cannot connect to API at $API_URL${NC}"
    echo "Make sure the backend is running: python3 -m uvicorn app.main:app --port 8000"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}"
echo ""

# Test 1: Health Check
echo "═══ Test 1: Health Check ═══"
test_endpoint "GET" "/health" "Health Check"

# Test 2: Get Cameras
echo "═══ Test 2: List Cameras ═══"
test_endpoint "GET" "/cameras" "Get All Cameras"

# Test 3: Get Statistics
echo "═══ Test 3: System Statistics ═══"
test_endpoint "GET" "/stats?days=7" "Get Statistics (Last 7 Days)"

# Test 4: Get Detections
echo "═══ Test 4: Detections ═══"
test_endpoint "GET" "/detections?limit=10" "Get Detections (First 10)"

# Test 5: Search Plate (if you have sample data)
echo "═══ Test 5: Search Plate ═══"
test_endpoint "GET" "/search?plate=AP16&limit=50" "Search by Plate Number"

# Test 6: Create Camera (optional)
echo "═══ Test 6: Create Camera ═══"
echo -e "${BLUE}Creating test camera...${NC}"
response=$(curl -s -X POST \
  "$API_URL/cameras" \
  -d "camera_id=test_cam_001&name=Test Camera&latitude=20.5937&longitude=78.9629&location=Test Location" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "  ${GREEN}✓ Status: $http_code${NC}"
else
    echo -e "  ${YELLOW}✗ Status: $http_code (Camera might already exist)${NC}"
fi
echo "  Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

# API Documentation
echo ""
echo "═══ API Documentation ═══"
echo -e "${GREEN}Full API documentation available at: ${BLUE}$API_URL/docs/swagger-ui${NC}"
echo ""

# Available Endpoints
echo "═══ Available Endpoints ═══"
cat << 'EOF'

GET Endpoints:
  /health                                  - Health check
  /cameras                                 - List all cameras
  /cameras/{camera_id}                    - Get specific camera
  /cameras/{camera_id}/detections         - Get camera detections
  /cameras/{camera_id}/vehicles?days=7    - Get unique vehicles
  /detections                              - Query detections (filterable)
  /detections/{id}                        - Get specific detection
  /stats?days=7                           - Get statistics
  /search?plate=XXX&limit=50              - Search by plate

POST Endpoints:
  /cameras                                 - Create new camera
    Parameters:
      - camera_id (required)
      - name (required)
      - latitude (required)
      - longitude (required)
      - location (optional)
      - stream_url (optional)

Query Filters:
  /detections?plate=XX&camera_id=c1&limit=100&offset=0
  /detections?vehicle_type=car&limit=50

EOF

echo ""
echo "═══ Sample cURL Commands ═══"
cat << 'EOF'

# Get all cameras
curl -X GET "http://localhost:8000/api/cameras"

# Search for a plate
curl -X GET "http://localhost:8000/api/search?plate=AP16CU"

# Get statistics
curl -X GET "http://localhost:8000/api/stats?days=7"

# Get all detections
curl -X GET "http://localhost:8000/api/detections?limit=50"

# Create a camera
curl -X POST "http://localhost:8000/api/cameras" \
  -d "camera_id=cam_001&name=Main Gate&latitude=20.5937&longitude=78.9629&location=Delhi"

# Get camera-specific detections
curl -X GET "http://localhost:8000/api/cameras/cam_001/detections?limit=100"

# Get unique vehicles for a camera
curl -X GET "http://localhost:8000/api/cameras/cam_001/vehicles?days=30"

EOF

echo ""
echo -e "${GREEN}✓ API Testing Complete!${NC}"
echo ""
