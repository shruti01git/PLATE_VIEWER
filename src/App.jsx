import React, { useState } from 'react'

import Mapview from './components/Mapview'
import Cameraanalyticspanel from './components/Cameraanalyticspanel'
import Cameralist from './components/Cameralist'
import Searchbar from './components/Searchbar'

import data from './data/Data'

function App() {
  const [filteredDetections, setFilteredDetections] = useState([])

  const handleSearch = (plate) => {
    const results = data.detections.filter(
      (d) => d.plate.toLowerCase() === plate.toLowerCase()
    )

    setFilteredDetections(results)
  }

  // 🔥 Camera-wise count
  const cameraCounts = {}
  filteredDetections.forEach((d) => {
    cameraCounts[d.camera] = (cameraCounts[d.camera] || 0) + 1
  })

  // 🔥 Unique vehicle count
  const uniqueVehicles = new Set(
    filteredDetections.map((d) => d.plate)
  ).size

  return (
    <div style={{ padding: '10px' }}>
      <h2>Connected Intelligence - Phase 2</h2>

      <Searchbar onSearch={handleSearch} />

      <div style={{ margin: '10px 0' }}>
        <span><b>Total Detections:</b> {filteredDetections.length}</span> |{" "}
        <span><b>Unique Vehicles:</b> {uniqueVehicles}</span>
      </div>

      <Cameralist cameraCounts={cameraCounts} />

      <div style={{ display: 'flex', marginTop: '10px' }}>
        <Cameraanalyticspanel detections={filteredDetections} />
        <Mapview detections={filteredDetections} />
      </div>
    </div>
  )
}

export default App
