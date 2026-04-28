"""
Counting module for vehicle counting and analytics
"""
import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class CountingLine:
    """Virtual line for counting vehicles crossing it"""
    
    def __init__(self, p1, p2, name="default"):
        """
        Initialize counting line
        
        Args:
            p1: First point (x1, y1)
            p2: Second point (x2, y2)
            name: Line name
        """
        self.p1 = np.array(p1, dtype=np.float32)
        self.p2 = np.array(p2, dtype=np.float32)
        self.name = name
        self.direction = self._get_direction()
        self.normal = np.array([-self.direction[1], self.direction[0]])
        self.normal = self.normal / np.linalg.norm(self.normal)
    
    def _get_direction(self):
        """Get normalized direction vector"""
        d = self.p2 - self.p1
        return d / np.linalg.norm(d)
    
    def distance_from_point(self, point):
        """Calculate signed distance from point to line"""
        point = np.array(point, dtype=np.float32)
        v = point - self.p1
        return np.dot(v, self.normal)
    
    def draw(self, frame, color=(0, 255, 0), thickness=2):
        """Draw line on frame"""
        pt1 = tuple(self.p1.astype(int))
        pt2 = tuple(self.p2.astype(int))
        import cv2
        cv2.line(frame, pt1, pt2, color, thickness)
        return frame


class VehicleCounter:
    """Track vehicle crossings and counts"""
    
    def __init__(self, line_distance_threshold=50):
        """
        Initialize counter
        
        Args:
            line_distance_threshold: Distance threshold for line crossing detection
        """
        self.lines = {}
        self.line_distance_threshold = line_distance_threshold
        self.crossings = defaultdict(lambda: {"up": 0, "down": 0, "total": 0})
        self.track_positions = {}  # {track_id: {"line_name": distance, ...}}
    
    def add_line(self, line):
        """Add counting line"""
        self.lines[line.name] = line
        logger.info(f"Added counting line: {line.name}")
    
    def add_line_by_points(self, p1, p2, name):
        """Add line by points"""
        line = CountingLine(p1, p2, name)
        self.add_line(line)
    
    def update(self, tracks):
        """
        Update counter with tracked vehicles
        
        Args:
            tracks: List of tracked vehicles with format:
                   [{"id": int, "bbox": [...], ...}, ...]
        """
        for track in tracks:
            track_id = track["id"]
            
            # Get track centroid
            bbox = track["bbox"]
            centroid = np.array([
                (bbox[0] + bbox[2]) / 2,
                (bbox[1] + bbox[3]) / 2,
            ], dtype=np.float32)
            
            # Initialize track position if new
            if track_id not in self.track_positions:
                self.track_positions[track_id] = {}
            
            # Check line crossings
            for line_name, line in self.lines.items():
                current_distance = line.distance_from_point(centroid)
                previous_distance = self.track_positions[track_id].get(line_name, current_distance)
                
                # Check if crossed the line
                if abs(current_distance) < self.line_distance_threshold:
                    # Crossed through threshold zone
                    if previous_distance < -self.line_distance_threshold and current_distance > 0:
                        self.crossings[line_name]["down"] += 1
                        self.crossings[line_name]["total"] += 1
                        logger.info(f"Vehicle {track_id} crossed {line_name} (downward)")
                    elif previous_distance > self.line_distance_threshold and current_distance < 0:
                        self.crossings[line_name]["up"] += 1
                        self.crossings[line_name]["total"] += 1
                        logger.info(f"Vehicle {track_id} crossed {line_name} (upward)")
                
                self.track_positions[track_id][line_name] = current_distance
        
        # Clean up old tracks (not seen recently)
        # Keep only tracks that have been seen in last 100 frames
        # (This is simplified - can be improved with frame tracking)
    
    def get_counts(self):
        """Get all crossing counts"""
        return dict(self.crossings)
    
    def reset(self):
        """Reset counters"""
        self.crossings = defaultdict(lambda: {"up": 0, "down": 0, "total": 0})
        self.track_positions = {}


class RegionCounter:
    """Track vehicles in defined regions"""
    
    def __init__(self):
        """Initialize region counter"""
        self.regions = {}
        self.region_counts = {}
    
    def add_region(self, region_polygon, name):
        """
        Add region polygon
        
        Args:
            region_polygon: List of points forming polygon
            name: Region name
        """
        self.regions[name] = np.array(region_polygon, dtype=np.int32)
        self.region_counts[name] = 0
    
    def point_in_polygon(self, point, polygon):
        """Check if point is inside polygon"""
        import cv2
        return cv2.pointPolygonTest(polygon, tuple(point), False) >= 0
    
    def update(self, tracks):
        """Update region counts"""
        for region_name, polygon in self.regions.items():
            count = 0
            for track in tracks:
                bbox = track["bbox"]
                centroid = np.array([
                    (bbox[0] + bbox[2]) / 2,
                    (bbox[1] + bbox[3]) / 2,
                ], dtype=np.int32)
                
                if self.point_in_polygon(centroid, polygon):
                    count += 1
            
            self.region_counts[region_name] = count
    
    def get_counts(self):
        """Get region counts"""
        return dict(self.region_counts)
