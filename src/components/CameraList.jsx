import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import '../styles/CameraList.css'

function CameraList({ cameraCounts }) {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [cameraDetails, setCameraDetails] = useState(null)

  useEffect(() => {
    loadCameras()
  }, [])

  const loadCameras = async () => {
    try {
      setLoading(true)
      const data = await apiService.getCameras()
      setCameras(data)
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCameraClick = async (camera) => {
    setSelectedCamera(camera.id)
    try {
      const details = await apiService.getCameraVehicles(camera.id)
      setCameraDetails(details)
    } catch (error) {
      console.error('Error loading camera details:', error)
    }
  }

  if (loading) {
    return <div className="camera-list-container">Loading cameras...</div>
  }

  return (
    <div className="camera-list-container">
      <div className="camera-list-header">
        <h3>📷 Active Cameras</h3>
        <span className="camera-count">{cameras.length} cameras</span>
      </div>

      {cameras.length === 0 ? (
        <p className="no-data">No cameras available</p>
      ) : (
        <div className="camera-list">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className={`camera-item ${selectedCamera === camera.id ? 'active' : ''}`}
              onClick={() => handleCameraClick(camera)}
            >
              <div className="camera-info">
                <h4>{camera.name}</h4>
                <p className="camera-id">ID: {camera.id}</p>
                <p className="camera-location">{camera.location || 'Unknown location'}</p>
                <p className="camera-stats">
                  <span className="badge">{camera.vehicle_count || 0} detections</span>
                </p>
              </div>
              <div className="camera-status">
                {camera.is_active ? (
                  <span className="status-active">● Active</span>
                ) : (
                  <span className="status-inactive">● Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cameraDetails && selectedCamera && (
        <div className="camera-details">
          <h4>📊 Vehicles Detected (Last 7 days)</h4>
          {cameraDetails.unique_vehicles > 0 ? (
            <div className="vehicles-list">
              {cameraDetails.vehicles.slice(0, 5).map((vehicle, idx) => (
                <div key={idx} className="vehicle-item">
                  <span className="vehicle-plate">{vehicle.plate}</span>
                  <span className="vehicle-type">{vehicle.vehicle_type}</span>
                  <span className="vehicle-count">×{vehicle.count}</span>
                </div>
              ))}
              {cameraDetails.vehicles.length > 5 && (
                <p className="more-vehicles">+{cameraDetails.vehicles.length - 5} more...</p>
              )}
            </div>
          ) : (
            <p>No vehicles detected</p>
          )}
        </div>
      )}
    </div>
  )
}

export default CameraList
