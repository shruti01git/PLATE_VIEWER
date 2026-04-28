import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import '../styles/CameraAnalyticsPanel.css'

function CameraAnalyticsPanel({ detections }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    // Reload stats when detections change
    if (detections && detections.length > 0) {
      loadStats()
    }
  }, [detections])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await apiService.getStats(7)
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVehicleTypeColor = (type) => {
    const colors = {
      car: '#4CAF50',
      motorcycle: '#FF9800',
      bus: '#2196F3',
      truck: '#F44336',
    }
    return colors[type] || '#9E9E9E'
  }

  return (
    <div className="analytics-panel">
      <div className="analytics-header">
        <h3>📊 Analytics Dashboard</h3>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <>
          {/* Detection Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{detections?.length || 0}</div>
              <div className="stat-label">Detections</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.unique_plates || 0}</div>
              <div className="stat-label">Unique Vehicles</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.cameras_active?.length || 0}</div>
              <div className="stat-label">Active Cameras</div>
            </div>
          </div>

          {/* Vehicle Types */}
          {stats?.vehicle_types && Object.keys(stats.vehicle_types).length > 0 && (
            <div className="analytics-section">
              <h4>🚗 Vehicle Types</h4>
              <div className="vehicle-types">
                {Object.entries(stats.vehicle_types).map(([type, count]) => (
                  <div key={type} className="vehicle-type-item">
                    <div
                      className="type-bar"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.vehicle_types))) * 100}%`,
                        backgroundColor: getVehicleTypeColor(type),
                      }}
                    ></div>
                    <span className="type-label">{type}</span>
                    <span className="type-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Plates */}
          {stats?.top_plates && stats.top_plates.length > 0 && (
            <div className="analytics-section">
              <h4>🔝 Top Detected Plates</h4>
              <div className="top-plates">
                {stats.top_plates.map((plate, idx) => (
                  <div key={idx} className="top-plate-item">
                    <span className="plate-rank">#{idx + 1}</span>
                    <span className="plate-number">{plate.plate}</span>
                    <span className="plate-count">×{plate.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Detections */}
          <div className="analytics-section">
            <h4>🎯 Current Detections ({detections?.length || 0})</h4>
            {detections && detections.length > 0 ? (
              <div className="detections-list">
                {detections.slice(0, 5).map((d, index) => (
                  <div key={index} className="detection-item">
                    <div className="detection-plate">{d.plate}</div>
                    <div className="detection-info">
                      <p className="detection-type">{d.vehicle_type}</p>
                      <p className="detection-camera">{d.camera_name}</p>
                      <p className="detection-time">{new Date(d.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="detection-confidence">{(d.confidence * 100).toFixed(0)}%</div>
                  </div>
                ))}
                {detections.length > 5 && (
                  <p className="more-detections">+{detections.length - 5} more detections</p>
                )}
              </div>
            ) : (
              <p className="no-detections">No detections yet. Search for a plate to see results.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CameraAnalyticsPanel
