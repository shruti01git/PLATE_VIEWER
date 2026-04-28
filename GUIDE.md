# 🚗 Multi-Camera Vehicle Intelligence System - Complete Guide

## 📖 Documentation Index

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the System](#running-the-system)
6. [API Reference](#api-reference)
7. [Video Processing](#video-processing)
8. [Database Schema](#database-schema)
9. [Performance Tuning](#performance-tuning)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is it?

The Multi-Camera Vehicle Intelligence System is an AI-powered surveillance platform that:

1. **Detects** vehicles in video streams using YOLOv8
2. **Tracks** vehicles across frames and cameras using SORT
3. **Recognizes** number plates using EasyOCR
4. **Counts** vehicles crossing virtual lines or in regions
5. **Stores** all data in SQLite database
6. **Visualizes** routes on interactive maps
7. **Provides** REST API for querying and analysis

### Key Benefits

- ✅ Real-time vehicle detection and tracking
- ✅ Automatic number plate recognition
- ✅ Multi-camera vehicle tracking
- ✅ Pure Python backend (no external dependencies)
- ✅ Fast API with comprehensive documentation
- ✅ Modern React frontend with maps
- ✅ CPU and GPU support
- ✅ Easy to extend and customize

---

## Architecture

### Data Flow

```
Video Input (File/RTSP)
    ↓
[Ingestion] - Load and frame extraction
    ↓
[Detection] - YOLOv8 vehicle detection
    ↓
[Tracking] - SORT algorithm for persistent IDs
    ↓
[OCR] - EasyOCR for plate recognition
    ↓
[Counting] - Line/region-based counting
    ↓
[Storage] - SQLite database
    ↓
[API] - FastAPI REST endpoints
    ↓
[UI] - React frontend with visualization
```

### Component Interaction

```
┌─────────────────────────────────────────────┐
│           FastAPI Backend                    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         Pipeline Services             │   │
│  │ ┌──────────────────────────────────┐  │   │
│  │ │ Detection (YOLOv8)               │  │   │
│  │ ├──────────────────────────────────┤  │   │
│  │ │ Tracking (SORT)                  │  │   │
│  │ ├──────────────────────────────────┤  │   │
│  │ │ OCR (EasyOCR)                    │  │   │
│  │ ├──────────────────────────────────┤  │   │
│  │ │ Counting (Line/Region)           │  │   │
│  │ └──────────────────────────────────┘  │   │
│  └──────────────────────────────────────┘   │
│                     ↓                        │
│  ┌──────────────────────────────────────┐   │
│  │      SQLite Database                  │   │
│  │  - Detections                         │   │
│  │  - Cameras                            │   │
│  └──────────────────────────────────────┘   │
│                     ↓                        │
│  ┌──────────────────────────────────────┐   │
│  │      REST API Routes                  │   │
│  │  /api/detections                      │   │
│  │  /api/cameras                         │   │
│  │  /api/stats                           │   │
│  │  /api/search                          │   │
│  └──────────────────────────────────────┘   │
└────────────────────┬─────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌────────────┐          ┌────────────┐
    │   React    │          │  Leaflet   │
    │ Frontend   │          │    Maps    │
    └────────────┘          └────────────┘
```

---

## Installation

### Prerequisites

```bash
# Check Python version
python3 --version  # Should be 3.9 or higher

# Check Node.js
node --version     # Should be 18 or higher

# Check npm
npm --version      # Should be 9 or higher

# System packages (Ubuntu/Debian)
sudo apt-get install libsm6 libxext6 libxrender-dev libgomp1
```

### Backend Installation

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize database
python3 -c "from app.models.database import init_db; init_db()"

# Download YOLOv8
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Frontend Installation

```bash
# From root directory
npm install

# Or specific installation
npm install leaflet react-leaflet
```

---

## Configuration

### Backend Settings

Edit `backend/app/config/settings.py`:

```python
# Model Configuration
YOLO_MODEL = "yolov8n"           # n, s, m, l, x
YOLO_CONFIDENCE = 0.5            # 0.0-1.0
YOLO_DEVICE = "cpu"              # "cpu" or GPU index

# Tracking Configuration  
TRACKER_MAX_AGE = 30             # Frames to keep dead track
TRACKER_MAX_DISTANCE = 50        # Max pixel distance
TRACKER_MATCH_THRESHOLD = 0.7    # IoU threshold

# OCR Configuration
OCR_GPU = False                  # Use GPU for OCR
MIN_PLATE_CONFIDENCE = 0.3       # Minimum OCR confidence

# Processing Configuration
FRAME_SKIP = 2                   # Process every Nth frame
LINE_CROSS_DISTANCE = 50         # Pixel threshold for line crossing

# Database
DATABASE_URL = "sqlite:///./vehicle_intelligence.db"
```

### Environment Variables

Create `backend/.env`:

```bash
API_HOST=0.0.0.0
API_PORT=8000
YOLO_DEVICE=cpu
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `.env.local`:

```
VITE_API_URL=http://localhost:8000/api
```

---

## Running the System

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Terminal 3 - API Documentation:**
```
Open: http://localhost:8000/docs
```

**Terminal 4 - Frontend UI:**
```
Open: http://localhost:5173
```

### Production Mode

```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Reference

### Search for Vehicle

**Request:**
```bash
curl -X GET "http://localhost:8000/api/search?plate=AP16CU&limit=50"
```

**Response:**
```json
{
  "search_plate": "AP16CU",
  "total_results": 5,
  "cameras": [
    {
      "camera_id": "cam_001",
      "camera_name": "Highway Entrance",
      "latitude": 20.5937,
      "longitude": 78.9629,
      "detections": [
        {
          "id": 1,
          "plate": "AP16CU6672",
          "timestamp": "2025-01-15T10:30:45",
          "vehicle_type": "car",
          "confidence": 0.95
        }
      ]
    }
  ]
}
```

### Get Statistics

**Request:**
```bash
curl -X GET "http://localhost:8000/api/stats?days=7"
```

**Response:**
```json
{
  "period_days": 7,
  "total_detections": 1250,
  "unique_plates": 145,
  "vehicle_types": {
    "car": 890,
    "bike": 210,
    "bus": 85,
    "truck": 65
  },
  "cameras_active": [
    {
      "camera_id": "cam_001",
      "camera_name": "Highway Entrance",
      "detections": 450
    }
  ],
  "top_plates": [
    {
      "plate": "AP16CU6672",
      "count": 12,
      "last_seen": "2025-01-15T15:20:30"
    }
  ]
}
```

### Get Cameras

**Request:**
```bash
curl -X GET "http://localhost:8000/api/cameras"
```

**Response:**
```json
[
  {
    "id": "cam_001",
    "name": "Highway Entrance",
    "latitude": 20.5937,
    "longitude": 78.9629,
    "location": "Delhi-Agra Highway",
    "is_active": 1,
    "vehicle_count": 450,
    "last_detection": "2025-01-15T15:20:30"
  }
]
```

---

## Video Processing

### Process Video File

```bash
python3 process_video.py <video_path> \
  --camera-id cam_001 \
  --camera-name "Highway Entrance" \
  --latitude 20.5937 \
  --longitude 78.9629 \
  --max-frames 500 \
  --output result.mp4
```

### Process RTSP Stream

```bash
python3 process_video.py rtsp://example.com/stream \
  --camera-id cam_002 \
  --camera-name "City Center" \
  --latitude 19.0760 \
  --longitude 72.8777
```

### Supported Formats

- **Video**: MP4, AVI, MOV, MKV, FLV
- **Streams**: RTSP, HTTP streams, MJPEG

---

## Database Schema

### Detections Table

```sql
CREATE TABLE detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate VARCHAR NOT NULL,
    camera_id VARCHAR NOT NULL,
    camera_name VARCHAR,
    vehicle_type VARCHAR,
    confidence FLOAT,
    latitude FLOAT,
    longitude FLOAT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    track_id INTEGER,
    frame_number INTEGER,
    image_path VARCHAR,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Cameras Table

```sql
CREATE TABLE cameras (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    location VARCHAR,
    stream_url VARCHAR,
    is_active INTEGER DEFAULT 1,
    vehicle_count INTEGER DEFAULT 0,
    last_detection DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Useful Queries

**Top 10 Most Detected Plates:**
```sql
SELECT plate, COUNT(*) as count
FROM detections
WHERE plate != 'UNKNOWN'
GROUP BY plate
ORDER BY count DESC
LIMIT 10;
```

**Detections by Camera:**
```sql
SELECT camera_id, COUNT(*) as count
FROM detections
GROUP BY camera_id
ORDER BY count DESC;
```

**Vehicle Types Distribution:**
```sql
SELECT vehicle_type, COUNT(*) as count
FROM detections
GROUP BY vehicle_type;
```

---

## Performance Tuning

### For CPU Systems

```python
# Reduce model size
YOLO_MODEL = "yolov8n"  # Use nano

# Increase frame skip
FRAME_SKIP = 3  # Process every 3rd frame

# Lower confidence
YOLO_CONFIDENCE = 0.4  # Faster detection

# Disable OCR GPU
OCR_GPU = False
```

### For GPU Systems

```python
# Use larger model
YOLO_MODEL = "yolov8m"

# Reduce frame skip
FRAME_SKIP = 1  # Process all frames

# Enable GPU
YOLO_DEVICE = "0"
OCR_GPU = True
```

### Optimization Tips

1. **Reduce video resolution** before processing
2. **Use object detection ROI** instead of full frame
3. **Batch process videos** instead of streaming
4. **Implement caching** for repeated searches
5. **Archive old detections** to database
6. **Use indexing** on frequently queried columns

---

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Environment Variables

```bash
PYTHONUNBUFFERED=1
YOLO_DEVICE=cpu
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
VITE_API_URL=https://api.example.com
```

### Nginx Configuration

See `nginx.conf` for production-ready configuration with:
- Reverse proxy
- Static asset caching
- Gzip compression
- Security headers

---

## Troubleshooting

### Model Download Issues

```bash
# Manual download
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Check location
python3 -c "from pathlib import Path; print(Path.home() / '.cache' / 'torch' / 'hub')"
```

### CUDA/GPU Issues

```bash
# Check CUDA availability
python3 -c "import torch; print(torch.cuda.is_available())"

# Force CPU
YOLO_DEVICE=cpu python3 process_video.py ...
```

### Database Locked

```bash
# Reset database
rm backend/vehicle_intelligence.db
python3 -c "from app.models.database import init_db; init_db()"
```

### Out of Memory

```python
# In settings.py
FRAME_SKIP = 5  # Process fewer frames
YOLO_MODEL = "yolov8n"  # Use smaller model
```

### Slow Processing

- Increase frame skip
- Reduce video resolution
- Process videos offline
- Use GPU acceleration
- Implement batching

---

## Examples

Run the examples script:

```bash
python3 backend/examples.py 1  # Initialize database
python3 backend/examples.py 2  # Query detections
python3 backend/examples.py 3  # Camera statistics
python3 backend/examples.py 4  # Search plate
python3 backend/examples.py 5  # Vehicle timeline
```

---

## Support & Resources

- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173
- **YOLOv8 Docs**: https://docs.ultralytics.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Leaflet Docs**: https://leafletjs.com/

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready
