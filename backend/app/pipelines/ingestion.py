"""
Video ingestion module for loading and processing video streams
"""
import cv2
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class VideoSource:
    """Handle video file or stream input"""
    
    def __init__(self, source, frame_skip=1, max_frames=None):
        """
        Initialize video source
        
        Args:
            source: Path to video file or RTSP URL
            frame_skip: Process every Nth frame (1 = process all)
            max_frames: Maximum frames to process (None = all)
        """
        self.source = source
        self.frame_skip = frame_skip
        self.max_frames = max_frames
        self.cap = None
        self.frame_count = 0
        self.fps = 0
        self.width = 0
        self.height = 0
        self.total_frames = 0
        
        self._open_source()
    
    def _open_source(self):
        """Open video source"""
        try:
            logger.info(f"Opening video source: {self.source}")
            
            # Try to open as file or stream
            if isinstance(self.source, str):
                if self.source.startswith(("http://", "https://", "rtsp://")):
                    # RTSP stream
                    self.cap = cv2.VideoCapture(self.source)
                    self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                else:
                    # Video file
                    self.cap = cv2.VideoCapture(self.source)
            else:
                self.cap = cv2.VideoCapture(self.source)
            
            if not self.cap.isOpened():
                raise Exception("Cannot open video source")
            
            # Get video properties
            self.fps = self.cap.get(cv2.CAP_PROP_FPS)
            self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            logger.info(
                f"Video opened: {self.width}x{self.height} @ {self.fps}fps, "
                f"Total frames: {self.total_frames}"
            )
            
        except Exception as e:
            logger.error(f"Error opening video source: {e}")
            raise
    
    def get_frame(self):
        """
        Get next frame with frame skipping
        
        Returns:
            Tuple of (frame, frame_number) or (None, None) if end of video
        """
        if self.cap is None:
            return None, None
        
        # Skip frames
        for _ in range(self.frame_skip):
            ret, frame = self.cap.read()
            if not ret:
                return None, None
            self.frame_count += 1
        
        # Check max frames limit
        if self.max_frames and self.frame_count > self.max_frames:
            return None, None
        
        return frame, self.frame_count
    
    def get_frames(self):
        """
        Generator for frames
        
        Yields:
            Tuple of (frame, frame_number)
        """
        while True:
            frame, frame_num = self.get_frame()
            if frame is None:
                break
            yield frame, frame_num
    
    def set_position(self, frame_num):
        """
        Set video position to frame number
        
        Args:
            frame_num: Frame number to seek to
        """
        if self.cap is None:
            return False
        
        ret = self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        if ret:
            self.frame_count = frame_num
        
        return ret
    
    def close(self):
        """Close video source"""
        if self.cap is not None:
            self.cap.release()
            logger.info("Video source closed")
    
    def get_properties(self):
        """Get video properties"""
        return {
            "source": str(self.source),
            "fps": self.fps,
            "width": self.width,
            "height": self.height,
            "total_frames": self.total_frames,
            "frame_count": self.frame_count,
        }
    
    def __del__(self):
        """Cleanup on deletion"""
        self.close()


class FrameBuffer:
    """Buffer frames for batch processing"""
    
    def __init__(self, buffer_size=30):
        """
        Initialize frame buffer
        
        Args:
            buffer_size: Maximum frames to buffer
        """
        self.buffer_size = buffer_size
        self.frames = []
        self.frame_numbers = []
    
    def add_frame(self, frame, frame_num):
        """Add frame to buffer"""
        self.frames.append(frame)
        self.frame_numbers.append(frame_num)
        
        if len(self.frames) > self.buffer_size:
            self.frames.pop(0)
            self.frame_numbers.pop(0)
    
    def get_batch(self):
        """Get batched frames"""
        return list(zip(self.frames, self.frame_numbers))
    
    def clear(self):
        """Clear buffer"""
        self.frames = []
        self.frame_numbers = []
    
    def is_full(self):
        """Check if buffer is full"""
        return len(self.frames) >= self.buffer_size
