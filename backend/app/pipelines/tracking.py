"""
Tracking module using SORT algorithm for vehicle tracking
"""
import numpy as np
from scipy.optimize import linear_sum_assignment
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class KalmanFilter:
    """Simple Kalman Filter for tracking"""
    
    def __init__(self):
        self.ndim = 4
        self.dt = 1.0
        
    def predict(self, mean, covariance):
        """Predict next state"""
        mean = np.array(mean, dtype=np.float32)
        covariance = np.array(covariance, dtype=np.float32)
        
        # Constant velocity model
        mean[:2] += mean[2:4] * self.dt
        
        return mean, covariance
    
    def update(self, mean, covariance, measurement):
        """Update with measurement"""
        mean = np.array(mean, dtype=np.float32)
        covariance = np.array(covariance, dtype=np.float32)
        measurement = np.array(measurement, dtype=np.float32)
        
        # Simple update: average old and new
        mean = 0.7 * mean + 0.3 * measurement
        
        return mean, covariance


class Track:
    """Single track for a vehicle"""
    
    _id_counter = 0
    
    def __init__(self, bbox):
        """Initialize track"""
        Track._id_counter += 1
        self.id = Track._id_counter
        self.bbox = bbox
        self.centroid = self._get_centroid(bbox)
        self.age = 0
        self.hits = 0
        self.misses = 0
        self.kalman_filter = KalmanFilter()
        self.mean = np.array([self.centroid[0], self.centroid[1], 0, 0], dtype=np.float32)
        self.covariance = np.eye(4, dtype=np.float32) * 10
    
    @staticmethod
    def _get_centroid(bbox):
        """Get centroid from bbox [x1, y1, x2, y2]"""
        x1, y1, x2, y2 = bbox
        return np.array([(x1 + x2) / 2, (y1 + y2) / 2], dtype=np.float32)
    
    def predict(self):
        """Predict next position"""
        self.mean, self.covariance = self.kalman_filter.predict(self.mean, self.covariance)
        self.age += 1
        self.misses += 1
    
    def update(self, bbox):
        """Update track with new detection"""
        self.bbox = bbox
        new_centroid = self._get_centroid(bbox)
        self.mean[2] = (new_centroid[0] - self.centroid[0]) / 1.0  # velocity x
        self.mean[3] = (new_centroid[1] - self.centroid[1]) / 1.0  # velocity y
        self.mean[0] = new_centroid[0]
        self.mean[1] = new_centroid[1]
        self.centroid = new_centroid
        self.hits += 1
        self.misses = 0


class Sort:
    """SORT tracker for vehicle tracking"""
    
    def __init__(self, max_age=30, min_hits=3, iou_threshold=0.3):
        """
        Initialize SORT
        
        Args:
            max_age: Maximum frames to keep alive a track without detections
            min_hits: Minimum hits before track is confirmed
            iou_threshold: IoU threshold for matching
        """
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks = []
        self.frame_count = 0
    
    @staticmethod
    def _iou(bbox1, bbox2):
        """Calculate IoU between two bboxes"""
        x1_min, y1_min, x1_max, y1_max = bbox1
        x2_min, y2_min, x2_max, y2_max = bbox2
        
        # Calculate intersection
        xi_min = max(x1_min, x2_min)
        yi_min = max(y1_min, y2_min)
        xi_max = min(x1_max, x2_max)
        yi_max = min(y1_max, y2_max)
        
        inter_area = max(0, xi_max - xi_min) * max(0, yi_max - yi_min)
        
        # Calculate union
        bbox1_area = (x1_max - x1_min) * (y1_max - y1_min)
        bbox2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = bbox1_area + bbox2_area - inter_area
        
        if union_area == 0:
            return 0
        
        return inter_area / union_area
    
    def update(self, detections):
        """
        Update tracks with new detections
        
        Args:
            detections: List of detections [{"bbox": [x1, y1, x2, y2], ...}, ...]
            
        Returns:
            List of active tracks with format:
            [{"id": int, "bbox": [x1, y1, x2, y2], "class": str}, ...]
        """
        self.frame_count += 1
        
        # Predict locations
        for track in self.tracks:
            track.predict()
        
        # Convert detections to list of bboxes
        det_bboxes = [det["bbox"] for det in detections]
        det_classes = [det["class_name"] for det in detections]
        
        # Associate detections to tracks
        if len(self.tracks) > 0:
            iou_matrix = np.zeros((len(self.tracks), len(det_bboxes)))
            for t_idx, track in enumerate(self.tracks):
                for d_idx, bbox in enumerate(det_bboxes):
                    iou_matrix[t_idx, d_idx] = self._iou(track.bbox, bbox)
            
            # Hungarian algorithm
            track_indices, det_indices = linear_sum_assignment(-iou_matrix)
            
            # Filter by IoU threshold
            matched_pairs = []
            for t_idx, d_idx in zip(track_indices, det_indices):
                if iou_matrix[t_idx, d_idx] >= self.iou_threshold:
                    matched_pairs.append((t_idx, d_idx))
        else:
            matched_pairs = []
        
        matched_track_indices = set()
        matched_det_indices = set()
        
        # Update matched tracks
        for t_idx, d_idx in matched_pairs:
            self.tracks[t_idx].update(det_bboxes[d_idx])
            matched_track_indices.add(t_idx)
            matched_det_indices.add(d_idx)
        
        # Create new tracks for unmatched detections
        for d_idx, bbox in enumerate(det_bboxes):
            if d_idx not in matched_det_indices:
                track = Track(bbox)
                track.class_name = det_classes[d_idx]
                self.tracks.append(track)
        
        # Remove dead tracks
        self.tracks = [
            t for t in self.tracks
            if t.misses <= self.max_age or t.hits >= self.min_hits
        ]
        
        # Generate output
        output = []
        for track in self.tracks:
            if track.hits >= self.min_hits or self.frame_count <= self.min_hits:
                output.append({
                    "id": track.id,
                    "bbox": track.bbox,
                    "class": getattr(track, "class_name", "unknown"),
                    "confidence": 1.0,
                })
        
        return output
