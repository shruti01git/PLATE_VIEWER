import React from 'react'

function Mapview({ detections }) {
  return (
    <div style={{ width: '70%', padding: '10px' }}>
      
      <h3>Map View</h3>

      {detections.length === 0 ? (
        <p>No route to display</p>
      ) : (
        <div>
          <p><b>Route found for vehicle</b></p>

          <ul>
            {detections.map((d, index) => (
              <li key={index}>
                {d.camera} → {d.location} ({d.time})
              </li>
            ))}
          </ul>

          <p>Total points: {detections.length}</p>
        </div>
      )}

    </div>
  )
}

export default Mapview
