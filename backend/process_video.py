"""
Video processor script for batch processing videos
"""
import sys
import argparse
import logging
from pathlib import Path
from app.pipelines.ingestion import VideoSource
from app.services.pipeline import VideoPipeline
from app.models.database import Camera, SessionLocal, init_db
from app.config.settings import FRAME_SKIP

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_video(
    video_path,
    camera_id,
    camera_name,
    latitude,
    longitude,
    max_frames=None,
    output_video=None,
):
    """
    Process single video file
    
    Args:
        video_path: Path to video file
        camera_id: Camera ID
        camera_name: Camera name
        latitude: Camera latitude
        longitude: Camera longitude
        max_frames: Maximum frames to process
        output_video: Optional output video path
    """
    try:
        logger.info(f"Processing video: {video_path}")
        
        # Initialize database
        init_db()
        
        # Ensure camera exists in database
        db = SessionLocal()
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            camera = Camera(
                id=camera_id,
                name=camera_name,
                latitude=latitude,
                longitude=longitude,
            )
            db.add(camera)
            db.commit()
            logger.info(f"Created camera: {camera_id}")
        db.close()
        
        # Initialize pipeline
        pipeline = VideoPipeline(camera_id, camera_name, latitude, longitude)
        
        # Load video
        video = VideoSource(
            video_path,
            frame_skip=FRAME_SKIP,
            max_frames=max_frames,
        )
        
        logger.info(
            f"Video loaded: {video.width}x{video.height} @ {video.fps}fps, "
            f"Total frames: {video.total_frames}"
        )
        
        # Setup output video if requested
        output_writer = None
        if output_video:
            import cv2
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            output_writer = cv2.VideoWriter(
                output_video,
                fourcc,
                video.fps,
                (video.width, video.height),
            )
        
        # Process frames
        frame_count = 0
        detection_count = 0
        track_count = 0
        
        for frame, frame_num in video.get_frames():
            if frame is None:
                break
            
            # Process frame
            results = pipeline.process_frame(frame, frame_num)
            
            frame_count += 1
            detection_count += len(results.get("detections", []))
            track_count += len(results.get("tracks", []))
            
            # Draw results on frame if saving output
            if output_writer:
                # Draw detections
                import cv2
                frame_annotated = pipeline.detector.draw_detections(
                    frame,
                    results.get("detections", [])
                )
                
                # Draw tracking info
                for track in results.get("tracks", []):
                    x1, y1, x2, y2 = track["bbox"]
                    cv2.rectangle(frame_annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame_annotated,
                        f"ID: {track['id']}",
                        (x1, y1 - 20),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 0),
                        2,
                    )
                
                output_writer.write(frame_annotated)
            
            if frame_count % 30 == 0:
                logger.info(
                    f"Processed {frame_count} frames: "
                    f"{detection_count} detections, {track_count} tracks"
                )
        
        # Get final statistics
        stats = pipeline.get_statistics()
        
        logger.info("Video processing completed")
        logger.info(f"Statistics: {stats}")
        
        # Cleanup
        video.close()
        if output_writer:
            output_writer.release()
        
        return {
            "success": True,
            "frames_processed": frame_count,
            "total_detections": detection_count,
            "total_tracks": track_count,
            "statistics": stats,
        }
        
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        return {
            "success": False,
            "error": str(e),
        }


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Process video with vehicle detection and tracking"
    )
    parser.add_argument("video", help="Path to video file or RTSP stream URL")
    parser.add_argument("--camera-id", default="cam_001", help="Camera ID")
    parser.add_argument("--camera-name", default="Camera 1", help="Camera name")
    parser.add_argument("--latitude", type=float, default=0.0, help="Camera latitude")
    parser.add_argument("--longitude", type=float, default=0.0, help="Camera longitude")
    parser.add_argument("--max-frames", type=int, help="Maximum frames to process")
    parser.add_argument("--output", help="Output video path (optional)")
    
    args = parser.parse_args()
    
    result = process_video(
        video_path=args.video,
        camera_id=args.camera_id,
        camera_name=args.camera_name,
        latitude=args.latitude,
        longitude=args.longitude,
        max_frames=args.max_frames,
        output_video=args.output,
    )
    
    if result["success"]:
        logger.info("Video processing completed successfully")
        logger.info(f"Results: {result}")
        return 0
    else:
        logger.error(f"Video processing failed: {result['error']}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
