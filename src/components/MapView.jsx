import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiService } from '../services/api'
import '../styles/MapView.css'

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
})

const MapView = ({ detections }) => {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersGroup = useRef(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize map
  useEffect(() => {
    if (map.current) return

    if (!mapContainer.current) return

    map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current)

    markersGroup.current = L.featureGroup().addTo(map.current)

    // Load cameras
    loadCameras()
  }, [])

  const loadCameras = async () => {
    try {
      setIsLoading(true)
      const data = await apiService.getCameras()
      setCameras(data)
      addCameraMarkers(data)
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCameraMarkers = (cameraList) => {
    if (!map.current || !markersGroup.current) return

    markersGroup.current.clearLayers()

    cameraList.forEach((camera) => {
      const marker = L.marker([camera.latitude, camera.longitude], {
        icon: L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })

      const popupContent = document.createElement('div')
      popupContent.innerHTML = `
        <div class="camera-popup">
          <h4>${camera.name}</h4>
          <p><strong>ID:</strong> ${camera.id}</p>
          <p><strong>Location:</strong> ${camera.location || 'N/A'}</p>
          <p><strong>Detections:</strong> ${camera.vehicle_count || 0}</p>
          <p><strong>Last Detection:</strong> ${
            camera.last_detection ? new Date(camera.last_detection).toLocaleString() : 'Never'
          }</p>
        </div>
      `

      marker.bindPopup(popupContent)
      markersGroup.current.addLayer(marker)
    })
  }

  // Update markers when detections change
  useEffect(() => {
    if (!map.current || !markersGroup.current) return

    // Clear vehicle markers but keep camera markers
    const allLayers = map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.getIcon().options.iconUrl?.includes('red')) {
        map.current.removeLayer(layer)
      }
    })

    if (detections && detections.length > 0) {
      // Add vehicle markers
      detections.forEach((detection) => {
        const marker = L.marker([detection.latitude, detection.longitude], {
          icon: L.icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        })

        const popupContent = document.createElement('div')
        popupContent.innerHTML = `
          <div class="detection-popup">
            <p><strong>Plate:</strong> ${detection.plate}</p>
            <p><strong>Type:</strong> ${detection.vehicle_type}</p>
            <p><strong>Camera:</strong> ${detection.camera_name}</p>
            <p><strong>Time:</strong> ${new Date(detection.timestamp).toLocaleString()}</p>
            <p><strong>Confidence:</strong> ${(detection.confidence * 100).toFixed(1)}%</p>
          </div>
        `

        marker.bindPopup(popupContent)
        marker.addTo(map.current)
      })

      // Add route line between detections
      if (detections.length > 1) {
        const points = detections.map((d) => [d.latitude, d.longitude])
        L.polyline(points, { color: 'red', weight: 2, opacity: 0.7 }).addTo(map.current)

        // Fit bounds
        const group = new L.FeatureGroup(detections.map((d) => L.marker([d.latitude, d.longitude])))
        map.current.fitBounds(group.getBounds().pad(0.1))
      }
    }
  }, [detections])

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera)
    if (map.current) {
      map.current.setView([camera.latitude, camera.longitude], 13)
    }
  }

  return (
    <div className="map-view">
      <div className="map-header">
        <h3>📍 Vehicle Route Map</h3>
        {detections && detections.length > 0 && (
          <p className="detection-info">Showing {detections.length} detection(s)</p>
        )}
        {cameras.length > 0 && (
          <div className="camera-list">
            <h4>📷 Active Cameras</h4>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                className={`camera-btn ${selectedCamera?.id === cam.id ? 'active' : ''}`}
                onClick={() => handleCameraClick(cam)}
              >
                {cam.name}
              </button>
            ))}
          </div>
        )}
        {isLoading && <p>Loading cameras...</p>}
      </div>
      <div ref={mapContainer} className="map-container"></div>
    </div>
  )
}

export default MapView
