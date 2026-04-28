"""
Database models for vehicle detection and tracking
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.config.settings import DATABASE_URL, DATABASE_PATH

Base = declarative_base()


class Detection(Base):
    """Store vehicle detections with plate and camera information"""
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String, index=True)
    camera_id = Column(String, index=True)
    camera_name = Column(String)
    vehicle_type = Column(String)  # car, bike, bus, truck
    confidence = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    track_id = Column(Integer, index=True)
    frame_number = Column(Integer)
    image_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "plate": self.plate,
            "camera_id": self.camera_id,
            "camera_name": self.camera_name,
            "vehicle_type": self.vehicle_type,
            "confidence": self.confidence,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "track_id": self.track_id,
            "image_path": self.image_path,
        }


class Camera(Base):
    """Store camera information"""
    __tablename__ = "cameras"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(String)
    stream_url = Column(String)
    is_active = Column(Integer, default=1)
    vehicle_count = Column(Integer, default=0)
    last_detection = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "location": self.location,
            "stream_url": self.stream_url,
            "is_active": self.is_active,
            "vehicle_count": self.vehicle_count,
            "last_detection": self.last_detection.isoformat() if self.last_detection else None,
        }


# Database engine and session
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
