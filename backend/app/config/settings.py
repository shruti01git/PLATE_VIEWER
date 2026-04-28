"""
Configuration settings for the Multi-Camera Vehicle Intelligence System
"""
import os
from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL = f"sqlite:///{BASE_DIR}/vehicle_intelligence.db"
DATABASE_PATH = BASE_DIR / "vehicle_intelligence.db"

# YOLOv8 Configuration
YOLO_MODEL = "yolov8n"  # Nano model for CPU
YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", 0.5))
YOLO_IOU = float(os.getenv("YOLO_IOU", 0.45))
YOLO_DEVICE = os.getenv("YOLO_DEVICE", "cpu")  # cpu or 0, 1, 2 for GPU

# Vehicle classes to detect
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Tracking Configuration
TRACKER_MAX_DISTANCE = float(os.getenv("TRACKER_MAX_DISTANCE", 50))
TRACKER_MAX_AGE = int(os.getenv("TRACKER_MAX_AGE", 30))
TRACKER_MATCH_THRESHOLD = float(os.getenv("TRACKER_MATCH_THRESHOLD", 0.7))

# OCR Configuration
OCR_LANGUAGE = ["en"]
OCR_GPU = os.getenv("OCR_GPU", "false").lower() == "true"

# Video Processing
FRAME_SKIP = int(os.getenv("FRAME_SKIP", 2))  # Process every Nth frame
MIN_FRAME_SIZE = (640, 480)
MAX_FRAME_SIZE = (1920, 1080)

# Plate Recognition
MIN_PLATE_CONFIDENCE = float(os.getenv("MIN_PLATE_CONFIDENCE", 0.3))
PLATE_REGEX_INDIAN = r"^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$"

# Counting
LINE_CROSS_DISTANCE = int(os.getenv("LINE_CROSS_DISTANCE", 50))

# API Configuration
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", 8000))
API_RELOAD = os.getenv("API_RELOAD", "true").lower() == "true"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
