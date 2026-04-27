import React from 'react'

function Cameraanalyticspanel({ detections }) {
  return (
    <div style={{ width: '30%', padding: '10px' }}>
      
      <h3>Detections ({detections.length})</h3>

      {detections.length === 0 ? (
        <p>No detections found</p>
      ) : (
        detections.map((d, index) => (
          <div
            key={index}
            style={{
              background: '#f2f2f2',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '6px'
            }}
          >
            <p><b>Plate:</b> {d.plate}</p>
            <p><b>Camera:</b> {d.camera}</p>
            <p><b>Time:</b> {d.time}</p>
            <p><b>Location:</b> {d.location}</p>
          </div>
        ))
      )}

    </div>
  )
}

export default Cameraanalyticspanel
