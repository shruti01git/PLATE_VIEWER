# 🚗 Multi-Camera Vehicle Intelligence System

An AI-powered real-time surveillance system for vehicle detection, tracking, and number plate recognition using deep learning.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.9%2B-blue)
![React](https://img.shields.io/badge/react-19%2B-blue)

## 🎯 Features

- **🚗 Vehicle Detection**: Real-time detection using YOLOv8 (supports CPU & GPU)
- **📍 Multi-Camera Tracking**: Track vehicles across multiple camera feeds
- **🔍 Number Plate Recognition**: Extract and recognize Indian license plates using EasyOCR
- **🗺️ Interactive Map**: Visualize vehicle routes and camera locations using Leaflet
- **📊 Analytics Dashboard**: Real-time statistics and vehicle insights
- **🔎 Plate Search**: Search vehicles by license plate across all cameras
- **💾 SQLite Database**: Persistent storage of all detections
- **⚡ RESTful API**: Complete FastAPI backend with detailed documentation
- **🎨 Modern UI**: Responsive React frontend with real-time updates
- **🚀 CPU-Friendly**: Optimized for CPU-only systems
- **🎬 Batch Processing**: Process multiple videos with detailed reports

## 🏗️ System Architecture

```
Video Sources → Detection → Tracking → OCR → Counting → Database → API → React UI
```

## 📁 Project Structure

```
PLATE_VIEWER/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/routes.py       # REST endpoints
│   │   ├── models/database.py  # DB models
│   │   ├── pipelines/          # Core modules
│   │   │   ├── detection.py    # YOLOv8
│   │   │   ├── tracking.py     # SORT
│   │   │   ├── ocr.py          # EasyOCR
│   │   │   └── counting.py
│   │   └── main.py             # FastAPI app
│   ├── process_video.py        # Video processor
│   └── requirements.txt
├── src/                        # React frontend
│   ├── components/             # React components
│   ├── services/api.js         # API client
│   ├── styles/                 # CSS files
│   └── App.jsx
├── SETUP.md                    # Setup guide
└── README.md
```

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
npm install
npm run dev
```

### 3. Access Application

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **API Base**: http://localhost:8000/api

## 📺 Process Video

```bash
python3 backend/process_video.py video.mp4 \
  --camera-id cam_001 \
  --camera-name "Highway Entrance" \
  --latitude 20.5937 \
  --longitude 78.9629
```

## 🔌 API Examples

**Search plate**:
```bash
curl "http://localhost:8000/api/search?plate=AP16CU"
```

**Get statistics**:
```bash
curl "http://localhost:8000/api/stats?days=7"
```

**List cameras**:
```bash
curl "http://localhost:8000/api/cameras"
```

## 🧠 Core Modules

| Module | Purpose | Technology |
|--------|---------|------------|
| Detection | Vehicle detection | YOLOv8 |
| Tracking | Persistent IDs | SORT + Kalman |
| OCR | Plate recognition | EasyOCR |
| Counting | Vehicle counting | Line/Region based |
| Database | Data persistence | SQLite |
| API | Backend service | FastAPI |
| Frontend | Web interface | React + Leaflet |

## ⚙️ Configuration

Edit `backend/app/config/settings.py`:

```python
YOLO_MODEL = "yolov8n"      # Model size
YOLO_CONFIDENCE = 0.5       # Detection threshold
YOLO_DEVICE = "cpu"         # cpu or GPU index
FRAME_SKIP = 2              # Process every Nth frame
```

## 📊 Performance

| Metric | CPU | GPU |
|--------|-----|-----|
| Detection (480p) | ~100ms | ~15ms |
| FPS (no skip) | ~3 fps | ~14 fps |
| Memory | ~800MB | ~2GB |

## 🔧 Troubleshooting

**Model download issues**:
```bash
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

**CUDA errors** → Set `YOLO_DEVICE = "cpu"` in settings

**Out of memory** → Increase `FRAME_SKIP` in settings

See **SETUP.md** for detailed troubleshooting.

## 📚 Documentation

- [Full Setup Guide](./SETUP.md)
- [API Documentation](http://localhost:8000/docs)
- [YOLOv8 Docs](https://docs.ultralytics.com)
- [FastAPI Docs](https://fastapi.tiangolo.com)

## 🔐 Security

- Use HTTPS in production
- Implement authentication
- Rate limit API endpoints
- Regular database backups

## 📝 Tech Stack

**Backend**: Python, FastAPI, YOLOv8, EasyOCR, SQLAlchemy  
**Frontend**: React 19, Leaflet.js, Vite  
**Database**: SQLite  

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and create PR

## 📄 License

MIT License - See LICENSE file

## 🆘 Support

- Documentation: [SETUP.md](./SETUP.md)
- API Docs: http://localhost:8000/docs
- Issues: GitHub Issues

---

**Version**: 1.0.0 | **Status**: Production Ready | **Last Updated**: 2025

