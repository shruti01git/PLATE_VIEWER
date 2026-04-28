"""
Detection module using YOLOv8 for vehicle detection
"""
import cv2
import numpy as np
from ultralytics import YOLO
from app.config.settings import (
    YOLO_MODEL,
    YOLO_CONFIDENCE,
    YOLO_IOU,
    YOLO_DEVICE,
    VEHICLE_CLASSES,
)
import logging

logger = logging.getLogger(__name__)


class VehicleDetector:
    """YOLOv8-based vehicle detector"""

    def __init__(self, model_name=YOLO_MODEL, device=YOLO_DEVICE):
        """Initialize detector with YOLOv8 model"""
        try:
            logger.info(f"Loading YOLOv8 model: {model_name} on device: {device}")
            self.model = YOLO(f"{model_name}.pt")
            self.model.to(device)
            self.device = device
            self.confidence = YOLO_CONFIDENCE
            self.iou = YOLO_IOU
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

    def detect(self, frame):
        """
        Detect vehicles in a frame
        
        Args:
            frame: Input image (numpy array)
            
        Returns:
            List of detections with format:
            [{"class": int, "class_name": str, "confidence": float, "bbox": [x1, y1, x2, y2]}, ...]
        """
        try:
            # Run inference
            results = self.model(
                frame,
                conf=self.confidence,
                iou=self.iou,
                device=self.device,
                verbose=False,
            )

            detections = []
            
            if results[0].boxes is not None:
                boxes = results[0].boxes
                
                for box in boxes:
                    class_id = int(box.cls[0])
                    
                    # Only process vehicle classes
                    if class_id not in VEHICLE_CLASSES:
                        continue
                    
                    confidence = float(box.conf[0])
                    bbox = box.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2]
                    
                    detection = {
                        "class": class_id,
                        "class_name": VEHICLE_CLASSES.get(class_id, "unknown"),
                        "confidence": confidence,
                        "bbox": bbox.astype(int).tolist(),
                    }
                    detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"Error during detection: {e}")
            return []

    def draw_detections(self, frame, detections):
        """
        Draw detection bboxes on frame
        
        Args:
            frame: Input image
            detections: List of detections
            
        Returns:
            Image with drawn detections
        """
        frame_copy = frame.copy()
        colors = {
            "car": (0, 255, 0),
            "motorcycle": (255, 0, 0),
            "bus": (0, 255, 255),
            "truck": (255, 255, 0),
        }
        
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            class_name = det["class_name"]
            confidence = det["confidence"]
            color = colors.get(class_name, (255, 255, 255))
            
            # Draw bbox
            cv2.rectangle(frame_copy, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{class_name} {confidence:.2f}"
            cv2.putText(
                frame_copy,
                label,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )
        
        return frame_copy
