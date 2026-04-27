import React, { useState } from 'react'

import Mapview from './components/Mapview'
import Cameraanalyticspanel from './components/Cameraanalyticspanel'
import Cameralist from './components/Cameralist'
import Searchbar from './components/Searchbar'

import data from './data/Data'

function App() {
  const [searchPlate, setSearchPlate] = useState('')
  const [filteredDetections, setFilteredDetections] = useState([])

  const handleSearch = (plate) => {
    setSearchPlate(plate)

    const results = data.detections.filter(
      (d) => d.plate.toLowerCase() === plate.toLowerCase()
    )

    setFilteredDetections(results)
  }

  // 🔥 Camera count logic
  const cameraCounts = {}

  filteredDetections.forEach((d) => {
    cameraCounts[d.camera] = (cameraCounts[d.camera] || 0) + 1
  })

  return (
    <div>
      <Searchbar onSearch={handleSearch} />

      <Cameralist cameraCounts={cameraCounts} />

      <div style={{ display: 'flex' }}>
        <Cameraanalyticspanel detections={filteredDetections} />
        <Mapview detections={filteredDetections} />
      </div>
    </div>
  )
}

export default App
