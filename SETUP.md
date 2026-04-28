# Multi-Camera Vehicle Intelligence System - Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Running the System](#running-the-system)
5. [API Endpoints](#api-endpoints)
6. [Video Processing](#video-processing)
7. [Docker Deployment](#docker-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **FFmpeg** (for video processing)
- **CUDA 11.8+** (optional, for GPU acceleration)
- **4GB RAM minimum** (8GB recommended)

### Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm ffmpeg libsm6 libxext6

# macOS
brew install python3 node ffmpeg

# Windows
# Use Windows Package Manager or install from official websites
choco install python nodejs ffmpeg -y
```

## Backend Setup

### 1. Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate venv
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 2. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLOv8 model (will be done automatically on first run)
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### 3. Initialize Database

```bash
python3 -c "from app.models.database import init_db; init_db(); print('Database initialized')"
```

### 4. Create Sample Cameras (Optional)

```python
from app.models.database import SessionLocal, Camera

db = SessionLocal()

cameras = [
    Camera(id="cam_001", name="Highway Entrance", latitude=20.5937, longitude=78.9629, location="Delhi Highway"),
    Camera(id="cam_002", name="City Center", latitude=19.0760, longitude=72.8777, location="Mumbai Downtown"),
    Camera(id="cam_003", name="Airport Road", latitude=12.9716, longitude=77.5946, location="Bangalore Airport"),
]

for camera in cameras:
    existing = db.query(Camera).filter(Camera.id == camera.id).first()
    if not existing:
        db.add(camera)

db.commit()
db.close()
print("Sample cameras created")
```

### 5. Run Backend Server

```bash
# Development
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Backend will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Backend URL

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
npm run preview
```

## Running the System

### Terminal 1: Backend API

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend Development Server

```bash
cd frontend  # or src if at root
npm run dev
```

### Terminal 3: Video Processing (Optional)

```bash
cd backend
source venv/bin/activate
python3 process_video.py <video_path> --camera-id cam_001 --camera-name "Camera 1" --latitude 20.5937 --longitude 78.9629
```

Then open browser:
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:8000/docs`

## API Endpoints

### Health & Status

```
GET /api/health
```

### Detections

```
GET /api/detections?plate=XX12XX&limit=100
GET /api/detections/{id}
```

### Cameras

```
GET /api/cameras
GET /api/cameras/{camera_id}
GET /api/cameras/{camera_id}/detections
GET /api/cameras/{camera_id}/vehicles?days=7
POST /api/cameras
```

### Analytics

```
GET /api/stats?days=7
GET /api/search?plate=XX12XX
```

## Video Processing

### Process Local Video

```bash
python3 process_video.py /path/to/video.mp4 \
  --camera-id cam_001 \
  --camera-name "Highway Entrance" \
  --latitude 20.5937 \
  --longitude 78.9629 \
  --max-frames 1000 \
  --output output_video.mp4
```

### Options

- `--camera-id`: Unique camera identifier (required)
- `--camera-name`: Display name (required)
- `--latitude`: Camera latitude (required)
- `--longitude`: Camera longitude (required)
- `--max-frames`: Maximum frames to process (optional)
- `--output`: Output video path to save annotated video (optional)

### Supported Formats

- **Video Files**: MP4, AVI, MOV, MKV
- **Streams**: RTSP, HTTP streams

## Configuration

Edit `backend/app/config/settings.py`:

```python
# YOLOv8 Model
YOLO_MODEL = "yolov8n"  # nano, small, medium, large, xlarge
YOLO_CONFIDENCE = 0.5  # Detection confidence threshold
YOLO_DEVICE = "cpu"  # or "0", "1" for GPU

# Tracking
TRACKER_MAX_AGE = 30  # Frames to keep track alive
TRACKER_MAX_DISTANCE = 50  # Max distance for matching

# OCR
OCR_GPU = False  # Enable GPU for OCR

# Video Processing
FRAME_SKIP = 2  # Process every Nth frame

# Database
DATABASE_URL = "sqlite:///vehicle_intelligence.db"
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t vehicle-intelligence:latest .
```

### Run with Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    environment:
      - YOLO_DEVICE=cpu
    command: python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

```bash
docker-compose up -d
```

## Troubleshooting

### Backend Issues

**ModuleNotFoundError: No module named 'ultralytics'**
```bash
pip install ultralytics
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**CUDA Out of Memory**
```python
# In settings.py
YOLO_DEVICE = "cpu"  # Use CPU instead
```

**Database Locked**
```bash
# Remove database and reinitialize
rm backend/vehicle_intelligence.db
python3 -c "from app.models.database import init_db; init_db()"
```

### Frontend Issues

**API Connection Failed**
- Ensure backend is running on port 8000
- Check VITE_API_URL in .env
- Check browser Console (F12) for CORS errors

**Map Not Loading**
```bash
npm install leaflet --save
```

### Video Processing Issues

**Slow Processing**
- Use `--frame-skip 3` or higher to process fewer frames
- Reduce video resolution
- Use `YOLO_DEVICE=gpu` if CUDA available

**Out of Memory**
- Reduce batch size in config
- Use smaller video segments
- Increase frame skip

## Performance Optimization

### For Production

1. **Use YOLO Small or Larger**
   ```python
   YOLO_MODEL = "yolov8s"  # Instead of yolov8n
   ```

2. **Enable GPU**
   ```python
   YOLO_DEVICE = "0"  # GPU device index
   OCR_GPU = True
   ```

3. **Use Multi-Worker API**
   ```bash
   python3 -m uvicorn app.main:app --workers 4
   ```

4. **Database Optimization**
   - Create indexes on frequently queried fields
   - Archive old detections
   - Use connection pooling

5. **Caching**
   - Implement Redis caching for stats
   - Cache camera lists
   - Cache search results

## Support & Documentation

- API Documentation: `http://localhost:8000/docs`
- GitHub Issues: Report bugs and feature requests
- Database Schema: See `app/models/database.py`
- Configuration: See `app/config/settings.py`

## License

This project is provided as-is for educational and commercial use.

---

**Last Updated**: 2025
**Version**: 1.0.0
