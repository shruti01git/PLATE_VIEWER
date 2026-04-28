"""
OCR module for license plate recognition using EasyOCR
"""
import cv2
import numpy as np
import easyocr
import re
from app.config.settings import OCR_LANGUAGE, OCR_GPU, PLATE_REGEX_INDIAN
import logging

logger = logging.getLogger(__name__)


class PlateRecognizer:
    """License plate recognition using EasyOCR"""
    
    def __init__(self, gpu=OCR_GPU):
        """Initialize OCR reader"""
        try:
            logger.info(f"Initializing EasyOCR reader with GPU: {gpu}")
            self.reader = easyocr.Reader(OCR_LANGUAGE, gpu=gpu)
            logger.info("OCR reader initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing OCR: {e}")
            raise
    
    def extract_plate_region(self, frame, bbox):
        """
        Extract plate region from frame
        
        Args:
            frame: Input image
            bbox: Vehicle bbox [x1, y1, x2, y2]
            
        Returns:
            Cropped plate region (assumed to be bottom portion of vehicle)
        """
        x1, y1, x2, y2 = bbox
        height = y2 - y1
        
        # Plate is typically at bottom 20% of vehicle bbox
        plate_y1 = max(y1, int(y2 - height * 0.25))
        plate_y2 = y2
        plate_x1 = x1
        plate_x2 = x2
        
        if plate_y1 >= plate_y2 or plate_x1 >= plate_x2:
            return None
        
        plate_region = frame[plate_y1:plate_y2, plate_x1:plate_x2]
        
        if plate_region.size == 0:
            return None
        
        return plate_region
    
    def recognize(self, frame):
        """
        Recognize text in frame using OCR
        
        Args:
            frame: Input image (plate region)
            
        Returns:
            Recognized text or None
        """
        if frame is None or frame.size == 0:
            return None
        
        try:
            # Enhance image for better OCR
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
            
            # Apply contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # Thresholding
            _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Upsample for better recognition
            binary = cv2.resize(binary, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            
            # Run OCR
            results = self.reader.readtext(binary)
            
            if not results:
                return None
            
            # Extract and clean text
            text = "".join([result[1] for result in results]).strip().upper()
            text = self._clean_ocr_text(text)
            
            return text if text else None
            
        except Exception as e:
            logger.warning(f"Error during OCR: {e}")
            return None
    
    def recognize_from_vehicle(self, frame, bbox):
        """
        Recognize plate from vehicle detection
        
        Args:
            frame: Full frame
            bbox: Vehicle bbox
            
        Returns:
            Recognized plate text or None
        """
        plate_region = self.extract_plate_region(frame, bbox)
        if plate_region is None:
            return None
        
        return self.recognize(plate_region)
    
    @staticmethod
    def _clean_ocr_text(text):
        """
        Clean and post-process OCR text
        
        Handles common OCR confusions:
        - O ↔ 0 (letter O to digit zero)
        - I ↔ 1 (letter I to digit one)
        - S ↔ 5 (letter S to digit five)
        - B ↔ 8 (letter B to digit eight)
        """
        # Remove spaces
        text = text.replace(" ", "")
        
        # Remove special characters except hyphens
        text = re.sub(r"[^A-Z0-9\-]", "", text)
        
        # Common confusions - fix based on position
        # Indian plate format: AA12AB1234 (2 letters, 2 digits, 2 letters, 4 digits)
        if len(text) >= 10:
            text_list = list(text)
            
            # Positions 0-1: Should be letters
            for i in [0, 1]:
                if i < len(text_list) and text_list[i] == "0":
                    text_list[i] = "O"
            
            # Positions 2-3: Should be digits
            for i in [2, 3]:
                if i < len(text_list) and text_list[i] == "O":
                    text_list[i] = "0"
                if i < len(text_list) and text_list[i] == "I":
                    text_list[i] = "1"
            
            # Positions 4-5: Should be letters
            for i in [4, 5]:
                if i < len(text_list) and text_list[i] == "0":
                    text_list[i] = "O"
                if i < len(text_list) and text_list[i] == "1":
                    text_list[i] = "I"
            
            # Positions 6-9: Should be digits
            for i in range(6, min(10, len(text_list))):
                if text_list[i] == "O":
                    text_list[i] = "0"
                if text_list[i] == "I":
                    text_list[i] = "1"
                if text_list[i] == "S":
                    text_list[i] = "5"
                if text_list[i] == "B":
                    text_list[i] = "8"
            
            text = "".join(text_list)
        
        return text
    
    @staticmethod
    def validate_indian_plate(plate_text):
        """
        Validate if text matches Indian number plate format
        
        Args:
            plate_text: Plate text to validate
            
        Returns:
            True if valid Indian plate format
        """
        if not plate_text:
            return False
        
        # Indian format: AA12AB1234 or AA-12-AB-1234
        pattern = r"^[A-Z]{2}\-?[0-9]{2}\-?[A-Z]{2}\-?[0-9]{4}$"
        return bool(re.match(pattern, plate_text))
