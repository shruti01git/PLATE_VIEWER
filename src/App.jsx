import React, { useState, useEffect } from 'react'
import './App.css'

import MapView from './components/MapView'
import Cameraanalyticspanel from './components/Cameraanalyticspanel'
import CameraList from './components/CameraList'
import SearchBar from './components/SearchBar'
import { apiService } from './services/api'

function App() {
  const [filteredDetections, setFilteredDetections] = useState([])
  const [searchPlate, setSearchPlate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check API health on mount
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      await apiService.checkHealth()
      console.log('Backend API is healthy')
    } catch (err) {
      console.warn('Backend API is not available. Some features may not work.')
      setError('Backend API is not available')
    }
  }

  const handleSearch = async (plate) => {
    if (!plate.trim()) {
      setFilteredDetections([])
      setSearchPlate('')
      return
    }

    setIsLoading(true)
    setError(null)
    setSearchPlate(plate)

    try {
      const results = await apiService.searchPlate(plate, 100)
      
      // Flatten detections from all cameras
      const allDetections = []
      if (results.cameras) {
        results.cameras.forEach((camera) => {
          allDetections.push(...(camera.detections || []))
        })
      }

      // Sort by timestamp (newest first)
      allDetections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setFilteredDetections(allDetections)
    } catch (err) {
      console.error('Search failed:', err)
      setError(`Search failed: ${err.message}`)
      setFilteredDetections([])
    } finally {
      setIsLoading(false)
    }
  }

  const uniqueVehicles = new Set(
    filteredDetections.map((d) => d.plate)
  ).size

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🚗 Multi-Camera Vehicle Intelligence System</h1>
          <p className="header-subtitle">Real-time vehicle detection and tracking</p>
        </div>
      </header>

      {/* Search Section */}
      <div className="search-section">
        <SearchBar onSearch={handleSearch} />

        {error && <div className="error-message">⚠️ {error}</div>}

        {isLoading && <div className="loading-message">🔍 Searching...</div>}

        {searchPlate && (
          <div className="search-results-summary">
            <h3>Results for: <strong>{searchPlate}</strong></h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total Detections</span>
                <span className="stat-value">{filteredDetections.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Unique Camera Locations</span>
                <span className="stat-value">
                  {new Set(filteredDetections.map((d) => d.camera_id)).size}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Last Detection</span>
                <span className="stat-value">
                  {filteredDetections.length > 0
                    ? new Date(filteredDetections[0].timestamp).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Column: Analytics */}
        <div className="left-panel">
          <Cameraanalyticspanel detections={filteredDetections} />
          <CameraList cameraCounts={{}} />
        </div>

        {/* Right Column: Map */}
        <div className="right-panel">
          <MapView detections={filteredDetections} />
        </div>
      </div>
    </div>
  )
}

export default App
