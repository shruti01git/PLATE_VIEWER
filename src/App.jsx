import React, { useState } from "react";

import Mapview from "./components/Mapview";
import Cameraanalyticspanel from "./components/Cameraanalyticspanel";
import Cameralist from "./components/Cameralist";
import Searchbar from "./components/Searchbar";

import data from "./data/Data";

function App() {
  const [filteredDetections, setFilteredDetections] = useState([]);

  const handleSearch = (plate) => {
    const results = data.detections.filter(
      (d) => d.plate.toLowerCase() === plate.toLowerCase()
    );

    setFilteredDetections(results);
  };

  // ✅ Camera-wise count
  const cameraCounts = {};
  filteredDetections.forEach((d) => {
    cameraCounts[d.camera] = (cameraCounts[d.camera] || 0) + 1;
  });

  // ✅ Total vehicles (unique plates in filtered results)
  const uniqueVehicles = new Set(
    filteredDetections.map((d) => d.plate)
  ).size;

  return (
    <div>
      <Searchbar onSearch={handleSearch} />

      <h3>Total Vehicles: {uniqueVehicles}</h3>

      <Cameralist cameraCounts={cameraCounts} />

      <div style={{ display: "flex" }}>
        <Cameraanalyticspanel detections={filteredDetections} />
        <Mapview detections={filteredDetections} />
      </div>
    </div>
  );
}

export default App;
