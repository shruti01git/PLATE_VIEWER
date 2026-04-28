#!/usr/bin/env python3
"""
Example usage of the Multi-Camera Vehicle Intelligence System
"""

import sys
import asyncio
from app.models.database import SessionLocal, Camera, Detection, init_db
from app.services.pipeline import VideoPipeline
from app.config.settings import DATABASE_PATH
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_1_initialize_database():
    """Example 1: Initialize and setup database"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Initialize Database")
    print("="*60)
    
    try:
        init_db()
        print("✓ Database initialized")
        
        # Add sample cameras
        db = SessionLocal()
        
        cameras = [
            {
                "id": "highway_main",
                "name": "Highway Main Gate",
                "latitude": 20.5937,
                "longitude": 78.9629,
                "location": "Delhi-Agra Highway",
            },
            {
                "id": "city_center",
                "name": "City Center",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "location": "Mumbai Downtown",
            },
            {
                "id": "airport_road",
                "name": "Airport Road",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "location": "Bangalore Airport",
            },
        ]
        
        for cam_data in cameras:
            existing = db.query(Camera).filter(Camera.id == cam_data["id"]).first()
            if not existing:
                camera = Camera(**cam_data, is_active=1)
                db.add(camera)
                print(f"  + Added camera: {cam_data['name']}")
        
        db.commit()
        db.close()
        print("✓ Sample cameras added successfully")
        
    except Exception as e:
        print(f"✗ Error: {e}")


def example_2_query_detections():
    """Example 2: Query detections from database"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Query Detections")
    print("="*60)
    
    try:
        db = SessionLocal()
        
        # Get all detections
        all_detections = db.query(Detection).limit(5).all()
        print(f"Total detections in DB: {db.query(Detection).count()}")
        
        if all_detections:
            print("\nLatest detections:")
            for det in all_detections:
                print(f"  - Plate: {det.plate}, Camera: {det.camera_name}, "
                      f"Time: {det.timestamp}")
        else:
            print("  No detections yet. Process a video to create detections.")
        
        # Get unique plates
        unique_plates = db.query(Detection.plate).distinct().filter(
            Detection.plate != "UNKNOWN"
        ).limit(10).all()
        print(f"\nUnique plates detected: {len(unique_plates)}")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")


def example_3_camera_statistics():
    """Example 3: Get camera statistics"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Camera Statistics")
    print("="*60)
    
    try:
        db = SessionLocal()
        
        cameras = db.query(Camera).filter(Camera.is_active == 1).all()
        print(f"Active cameras: {len(cameras)}")
        
        for camera in cameras:
            # Get detections for this camera
            detection_count = db.query(Detection).filter(
                Detection.camera_id == camera.id
            ).count()
            
            # Get unique vehicles
            unique_vehicles = db.query(Detection.plate).distinct().filter(
                Detection.camera_id == camera.id,
                Detection.plate != "UNKNOWN",
            ).count()
            
            print(f"\n  📷 {camera.name}")
            print(f"    Location: {camera.location}")
            print(f"    Detections: {detection_count}")
            print(f"    Unique Vehicles: {unique_vehicles}")
            print(f"    Coordinates: ({camera.latitude}, {camera.longitude})")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")


def example_4_search_plate():
    """Example 4: Search for specific plate"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Search Plate")
    print("="*60)
    
    try:
        db = SessionLocal()
        
        # Example plate search
        plate_to_search = "AP16CU"
        
        detections = db.query(Detection).filter(
            Detection.plate.ilike(f"%{plate_to_search}%")
        ).order_by(Detection.timestamp.desc()).all()
        
        print(f"Searching for plate: {plate_to_search}")
        print(f"Found: {len(detections)} detections\n")
        
        # Group by camera
        by_camera = {}
        for det in detections:
            if det.camera_id not in by_camera:
                by_camera[det.camera_id] = []
            by_camera[det.camera_id].append(det)
        
        for camera_id, dets in by_camera.items():
            print(f"  📍 Camera ID: {camera_id}")
            for det in dets:
                print(f"    - Time: {det.timestamp}")
                print(f"      Type: {det.vehicle_type}")
                print(f"      Confidence: {det.confidence:.2f}")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")


def example_5_vehicle_timeline():
    """Example 5: Get vehicle timeline"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Vehicle Timeline")
    print("="*60)
    
    try:
        db = SessionLocal()
        
        # Get a sample unique plate
        plates = db.query(Detection.plate).filter(
            Detection.plate != "UNKNOWN"
        ).distinct().limit(1).all()
        
        if not plates:
            print("No detected plates in database yet.")
            db.close()
            return
        
        plate = plates[0][0]
        
        # Get all detections for this plate
        detections = db.query(Detection).filter(
            Detection.plate == plate
        ).order_by(Detection.timestamp).all()
        
        print(f"Vehicle Plate: {plate}")
        print(f"Total Detections: {len(detections)}")
        print(f"Vehicle Type: {detections[0].vehicle_type if detections else 'Unknown'}")
        print(f"\nDetection Timeline:")
        
        for i, det in enumerate(detections, 1):
            print(f"  {i}. {det.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"     Camera: {det.camera_name} (Lat: {det.latitude}, Lng: {det.longitude})")
            print(f"     Type: {det.vehicle_type}, Confidence: {det.confidence:.2f}")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")


def main():
    """Run all examples"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*15 + "EXAMPLES - Vehicle Intelligence System" + " "*5 + "║")
    print("╚" + "="*58 + "╝")
    
    examples = [
        ("Initialize Database & Add Cameras", example_1_initialize_database),
        ("Query Detections", example_2_query_detections),
        ("Camera Statistics", example_3_camera_statistics),
        ("Search by Plate", example_4_search_plate),
        ("Vehicle Timeline", example_5_vehicle_timeline),
    ]
    
    if len(sys.argv) > 1:
        example_num = int(sys.argv[1]) - 1
        if 0 <= example_num < len(examples):
            title, func = examples[example_num]
            print(f"\nRunning: {title}")
            func()
        else:
            print(f"Invalid example number. Choose 1-{len(examples)}")
    else:
        # Run all examples
        for title, func in examples:
            try:
                func()
            except Exception as e:
                print(f"\n✗ Error in {title}: {e}")
        
        print("\n" + "="*60)
        print("Examples completed!")
        print("="*60 + "\n")


if __name__ == "__main__":
    main()
