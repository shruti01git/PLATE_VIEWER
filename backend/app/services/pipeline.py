"""
Main processing pipeline orchestrating detection, tracking, and OCR
"""
import logging
from datetime import datetime
from app.pipelines.detection import VehicleDetector
from app.pipelines.tracking import Sort
from app.pipelines.ocr import PlateRecognizer
from app.pipelines.counting import VehicleCounter, CountingLine
from app.models.database import Detection, SessionLocal
from sqlalchemy import func

logger = logging.getLogger(__name__)


class VideoPipeline:
    """Main video processing pipeline"""
    
    def __init__(self, camera_id, camera_name, latitude, longitude):
        """
        Initialize pipeline
        
        Args:
            camera_id: Unique camera identifier
            camera_name: Camera name
            latitude: Latitude of camera
            longitude: Longitude of camera
        """
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.latitude = latitude
        self.longitude = longitude
        
        logger.info(f"Initializing pipeline for {camera_name}")
        
        try:
            self.detector = VehicleDetector()
            self.tracker = Sort(max_age=30, min_hits=3, iou_threshold=0.3)
            self.recognizer = PlateRecognizer()
            self.counter = VehicleCounter()
            
            # Add default counting line (horizontal middle line)
            # This would be camera-specific in production
            self.counter.add_line_by_points((0, 240), (1920, 240), "default")
            
            logger.info(f"Pipeline initialized successfully for {camera_name}")
        except Exception as e:
            logger.error(f"Error initializing pipeline: {e}")
            raise
        
        self.frame_detections = {}
    
    def process_frame(self, frame, frame_number):
        """
        Process single frame through complete pipeline
        
        Args:
            frame: Input frame
            frame_number: Frame number
            
        Returns:
            Processing results dictionary
        """
        try:
            results = {
                "frame_number": frame_number,
                "detections": [],
                "tracks": [],
            }
            
            # Step 1: Detection
            detections = self.detector.detect(frame)
            results["detections"] = detections
            
            # Step 2: Tracking
            tracks = self.tracker.update(detections)
            results["tracks"] = tracks
            
            # Step 3: OCR and storage
            db_detections = []
            for track in tracks:
                try:
                    plate_text = self.recognizer.recognize_from_vehicle(frame, track["bbox"])
                    
                    # Store detection in database
                    detection = self._store_detection(
                        track=track,
                        plate_text=plate_text,
                        frame_number=frame_number,
                    )
                    db_detections.append(detection)
                    
                except Exception as e:
                    logger.warning(f"Error processing track {track['id']}: {e}")
            
            results["db_detections"] = db_detections
            
            # Step 4: Counting
            self.counter.update(tracks)
            results["counts"] = self.counter.get_counts()
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return {
                "frame_number": frame_number,
                "detections": [],
                "tracks": [],
                "error": str(e),
            }
    
    def _store_detection(self, track, plate_text, frame_number):
        """
        Store detection in database
        
        Args:
            track: Track information
            plate_text: Recognized plate text (or None)
            frame_number: Frame number
            
        Returns:
            Stored detection object
        """
        try:
            db = SessionLocal()
            
            x1, y1, x2, y2 = track["bbox"]
            
            detection = Detection(
                plate=plate_text or "UNKNOWN",
                camera_id=self.camera_id,
                camera_name=self.camera_name,
                vehicle_type=track["class"],
                confidence=track.get("confidence", 0.0),
                latitude=self.latitude,
                longitude=self.longitude,
                timestamp=datetime.utcnow(),
                track_id=track["id"],
                frame_number=frame_number,
                image_path=None,  # Can add image saving logic
            )
            
            db.add(detection)
            db.commit()
            db.refresh(detection)
            db.close()
            
            logger.debug(f"Stored detection: {plate_text} in {self.camera_name}")
            
            return detection
            
        except Exception as e:
            logger.error(f"Error storing detection: {e}")
            return None
    
    def get_statistics(self):
        """Get pipeline statistics"""
        try:
            db = SessionLocal()
            
            total_detections = db.query(func.count(Detection.id)).filter(
                Detection.camera_id == self.camera_id
            ).scalar() or 0
            
            unique_plates = db.query(func.count(func.distinct(Detection.plate))).filter(
                Detection.camera_id == self.camera_id,
                Detection.plate != "UNKNOWN",
            ).scalar() or 0
            
            vehicle_types = db.query(
                Detection.vehicle_type,
                func.count(Detection.id)
            ).filter(
                Detection.camera_id == self.camera_id
            ).group_by(Detection.vehicle_type).all()
            
            db.close()
            
            return {
                "camera_id": self.camera_id,
                "camera_name": self.camera_name,
                "total_detections": total_detections,
                "unique_plates": unique_plates,
                "vehicle_types": dict(vehicle_types),
                "line_crossings": self.counter.get_counts(),
            }
            
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}
