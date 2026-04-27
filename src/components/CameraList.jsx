import React from 'react'

function Cameralist({ cameraCounts }) {
  return (
    <div style={{ marginTop: '10px' }}>
      
      <h3>Camera Activity</h3>

      {Object.keys(cameraCounts).length === 0 ? (
        <p>No camera data</p>
      ) : (
        Object.entries(cameraCounts).map(([camera, count]) => (
          <div
            key={camera}
            style={{
              padding: '6px',
              marginBottom: '5px',
              background: '#e6f2ff',
              borderRadius: '4px'
            }}
          >
            <b>{camera}</b>: {count} detections
          </div>
        ))
      )}

    </div>
  )
}

export default Cameralist
