"""
FastAPI endpoints for the vehicle intelligence system
"""
from fastapi import APIRouter, Query, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from app.models.database import Detection, Camera, SessionLocal, get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@router.get("/detections")
async def get_detections(
    plate: str = Query(None, description="Filter by plate number"),
    camera_id: str = Query(None, description="Filter by camera ID"),
    vehicle_type: str = Query(None, description="Filter by vehicle type"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get detections with optional filters"""
    try:
        query = db.query(Detection)
        
        if plate:
            query = query.filter(Detection.plate.ilike(f"%{plate}%"))
        
        if camera_id:
            query = query.filter(Detection.camera_id == camera_id)
        
        if vehicle_type:
            query = query.filter(Detection.vehicle_type == vehicle_type)
        
        total = query.count()
        detections = query.order_by(desc(Detection.timestamp)).offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "detections": [d.to_dict() for d in detections],
        }
    except Exception as e:
        logger.error(f"Error getting detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detections/{detection_id}")
async def get_detection(detection_id: int, db: Session = Depends(get_db)):
    """Get specific detection by ID"""
    try:
        detection = db.query(Detection).filter(Detection.id == detection_id).first()
        
        if not detection:
            raise HTTPException(status_code=404, detail="Detection not found")
        
        return detection.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cameras")
async def get_cameras(db: Session = Depends(get_db)):
    """Get all cameras"""
    try:
        cameras = db.query(Camera).filter(Camera.is_active == 1).all()
        return [c.to_dict() for c in cameras]
    except Exception as e:
        logger.error(f"Error getting cameras: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cameras/{camera_id}")
async def get_camera(camera_id: str, db: Session = Depends(get_db)):
    """Get specific camera"""
    try:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        
        return camera.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting camera: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cameras/{camera_id}/detections")
async def get_camera_detections(
    camera_id: str,
    vehicle_type: str = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get detections for specific camera"""
    try:
        query = db.query(Detection).filter(Detection.camera_id == camera_id)
        
        if vehicle_type:
            query = query.filter(Detection.vehicle_type == vehicle_type)
        
        detections = query.order_by(desc(Detection.timestamp)).limit(limit).all()
        
        return {
            "camera_id": camera_id,
            "count": len(detections),
            "detections": [d.to_dict() for d in detections],
        }
    except Exception as e:
        logger.error(f"Error getting camera detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cameras/{camera_id}/vehicles")
async def get_camera_vehicles(
    camera_id: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Get unique vehicles detected by camera"""
    try:
        since = datetime.utcnow() - timedelta(days=days)
        
        vehicles = db.query(
            Detection.plate,
            Detection.vehicle_type,
            func.count(Detection.id).label("count"),
            func.max(Detection.timestamp).label("last_seen"),
        ).filter(
            Detection.camera_id == camera_id,
            Detection.plate != "UNKNOWN",
            Detection.timestamp >= since,
        ).group_by(
            Detection.plate,
            Detection.vehicle_type,
        ).all()
        
        return {
            "camera_id": camera_id,
            "period_days": days,
            "unique_vehicles": len(vehicles),
            "vehicles": [
                {
                    "plate": v.plate,
                    "vehicle_type": v.vehicle_type,
                    "count": v.count,
                    "last_seen": v.last_seen.isoformat() if v.last_seen else None,
                }
                for v in vehicles
            ],
        }
    except Exception as e:
        logger.error(f"Error getting camera vehicles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """Get system statistics"""
    try:
        since = datetime.utcnow() - timedelta(days=days)
        
        # Total detections
        total_detections = db.query(func.count(Detection.id)).filter(
            Detection.timestamp >= since
        ).scalar() or 0
        
        # Unique plates
        unique_plates = db.query(func.count(func.distinct(Detection.plate))).filter(
            Detection.plate != "UNKNOWN",
            Detection.timestamp >= since,
        ).scalar() or 0
        
        # Vehicle types
        vehicle_types = db.query(
            Detection.vehicle_type,
            func.count(Detection.id).label("count")
        ).filter(
            Detection.timestamp >= since
        ).group_by(Detection.vehicle_type).all()
        
        # Cameras
        cameras = db.query(
            Detection.camera_id,
            Detection.camera_name,
            func.count(Detection.id).label("detections")
        ).filter(
            Detection.timestamp >= since
        ).group_by(
            Detection.camera_id,
            Detection.camera_name,
        ).all()
        
        # Top plates
        top_plates = db.query(
            Detection.plate,
            func.count(Detection.id).label("count"),
            func.max(Detection.timestamp).label("last_seen")
        ).filter(
            Detection.plate != "UNKNOWN",
            Detection.timestamp >= since,
        ).group_by(Detection.plate).order_by(
            desc(func.count(Detection.id))
        ).limit(10).all()
        
        return {
            "period_days": days,
            "total_detections": total_detections,
            "unique_plates": unique_plates,
            "vehicle_types": {v.vehicle_type: v.count for v in vehicle_types},
            "cameras_active": [
                {
                    "camera_id": c.camera_id,
                    "camera_name": c.camera_name,
                    "detections": c.detections,
                }
                for c in cameras
            ],
            "top_plates": [
                {
                    "plate": p.plate,
                    "count": p.count,
                    "last_seen": p.last_seen.isoformat() if p.last_seen else None,
                }
                for p in top_plates
            ],
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cameras")
async def create_camera(
    camera_id: str,
    name: str,
    latitude: float,
    longitude: float,
    location: str = "",
    stream_url: str = "",
    db: Session = Depends(get_db)
):
    """Create new camera"""
    try:
        # Check if camera already exists
        existing = db.query(Camera).filter(Camera.id == camera_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Camera already exists")
        
        camera = Camera(
            id=camera_id,
            name=name,
            latitude=latitude,
            longitude=longitude,
            location=location,
            stream_url=stream_url,
        )
        
        db.add(camera)
        db.commit()
        db.refresh(camera)
        
        logger.info(f"Created camera: {camera_id}")
        
        return camera.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating camera: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_plate(
    plate: str = Query(..., min_length=3),
    limit: int = Query(50, le=1000),
    db: Session = Depends(get_db)
):
    """Search for detections by plate number"""
    try:
        detections = db.query(Detection).filter(
            Detection.plate.ilike(f"%{plate}%"),
            Detection.plate != "UNKNOWN",
        ).order_by(desc(Detection.timestamp)).limit(limit).all()
        
        # Group by camera for response
        by_camera = {}
        for det in detections:
            if det.camera_id not in by_camera:
                by_camera[det.camera_id] = {
                    "camera_id": det.camera_id,
                    "camera_name": det.camera_name,
                    "latitude": det.latitude,
                    "longitude": det.longitude,
                    "detections": [],
                }
            by_camera[det.camera_id]["detections"].append(det.to_dict())
        
        return {
            "search_plate": plate,
            "total_results": len(detections),
            "cameras": list(by_camera.values()),
        }
    except Exception as e:
        logger.error(f"Error searching plate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
