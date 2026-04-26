// ─── Camera registry ───────────────────────────────────────────────────────
export const cameras = [
  { id: "LOCALCAM1", name: "North Gate",       lat: 16.5100, lng: 80.6317, zone: "Entry/Exit",  status: "active" },
  { id: "LOCALCAM2", name: "Building 5 Exit",  lat: 16.5075, lng: 80.6388, zone: "Campus",      status: "active" },
  { id: "LOCALCAM3", name: "Parking A",        lat: 16.5065, lng: 80.6310, zone: "Parking",     status: "active" },
  { id: "LOCALCAM4", name: "South Checkpoint", lat: 16.5040, lng: 80.6350, zone: "Entry/Exit",  status: "active" },
  { id: "LOCALCAM5", name: "Market Square",    lat: 16.5085, lng: 80.6330, zone: "Public",      status: "active" },
];

// ─── Vehicle metadata ───────────────────────────────────────────────────────
export const vehicleMetadata = {
  "AP16CU6672": { type: "Car",   make: "Maruti",  model: "Swift",    color: "White",  owner: "Rahul S.",   flagged: false },
  "AP40CT2310": { type: "SUV",   make: "Hyundai", model: "Creta",    color: "Silver", owner: "Priya M.",   flagged: false },
  "AP39UX9232": { type: "Truck", make: "Tata",    model: "407",      color: "Blue",   owner: "Logistics Co", flagged: true  },
  "AP29AB1234": { type: "Car",   make: "Honda",   model: "City",     color: "Red",    owner: "Amit K.",    flagged: false },
  "AP16XY5678": { type: "Bike",  make: "Bajaj",   model: "Pulsar",   color: "Black",  owner: "Suresh R.",  flagged: false },
  "TS09GH3344": { type: "Car",   make: "Toyota",  model: "Innova",   color: "Grey",   owner: "Ravi P.",    flagged: false },
  "AP28MN7890": { type: "Van",   make: "Force",   model: "Traveller",color: "White",  owner: "Travel Co",  flagged: false },
};

// ─── Detection events ──────────────────────────────────────────────────────
export const detections = [
  // AP16CU6672 journey
  { plate: "AP16CU6672", cameraId: "LOCALCAM1", ts: "2025-08-08T10:05:12Z" },
  { plate: "AP16CU6672", cameraId: "LOCALCAM2", ts: "2025-08-08T10:09:50Z" },
  { plate: "AP16CU6672", cameraId: "LOCALCAM3", ts: "2025-08-08T10:14:33Z" },

  // AP40CT2310 journey
  { plate: "AP40CT2310", cameraId: "LOCALCAM2", ts: "2025-08-08T09:41:05Z" },
  { plate: "AP40CT2310", cameraId: "LOCALCAM1", ts: "2025-08-08T09:56:22Z" },

  // AP39UX9232
  { plate: "AP39UX9232", cameraId: "LOCALCAM1", ts: "2025-08-08T08:12:10Z" },
  { plate: "AP39UX9232", cameraId: "LOCALCAM4", ts: "2025-08-08T08:25:44Z" },

  // Additional vehicles
  { plate: "AP29AB1234", cameraId: "LOCALCAM4", ts: "2025-08-08T07:30:00Z" },
  { plate: "AP29AB1234", cameraId: "LOCALCAM5", ts: "2025-08-08T07:45:11Z" },
  { plate: "AP29AB1234", cameraId: "LOCALCAM1", ts: "2025-08-08T08:01:22Z" },

  { plate: "AP16XY5678", cameraId: "LOCALCAM3", ts: "2025-08-08T11:10:05Z" },
  { plate: "AP16XY5678", cameraId: "LOCALCAM5", ts: "2025-08-08T11:22:38Z" },

  { plate: "TS09GH3344", cameraId: "LOCALCAM2", ts: "2025-08-08T12:05:00Z" },
  { plate: "TS09GH3344", cameraId: "LOCALCAM4", ts: "2025-08-08T12:19:45Z" },

  { plate: "AP28MN7890", cameraId: "LOCALCAM5", ts: "2025-08-08T13:00:00Z" },
  { plate: "AP28MN7890", cameraId: "LOCALCAM1", ts: "2025-08-08T13:15:33Z" },
  { plate: "AP28MN7890", cameraId: "LOCALCAM3", ts: "2025-08-08T13:28:00Z" },

  // Historical — day before
  { plate: "AP16CU6672", cameraId: "LOCALCAM1", ts: "2025-08-07T09:00:00Z" },
  { plate: "AP40CT2310", cameraId: "LOCALCAM3", ts: "2025-08-07T14:30:00Z" },
  { plate: "AP39UX9232", cameraId: "LOCALCAM2", ts: "2025-08-07T08:45:00Z" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Return chronological, deduplicated sightings of a plate across all cameras. */
export function getJourneyForPlate(plate) {
  const norm = plate.trim().toUpperCase();
  const seen = new Set();
  return detections
    .filter(d => d.plate.toUpperCase().includes(norm))
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
    .map(d => {
      const cam = cameras.find(c => c.id === d.cameraId);
      return cam ? { ...d, ...cam } : null;
    })
    .filter(Boolean)
    .filter(e => {
      const key = `${e.cameraId}@${e.ts}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Return all detections for a single camera, sorted newest-first. */
export function getCameraAnalytics(cameraId) {
  const cam = cameras.find(c => c.id === cameraId);
  if (!cam) return null;

  const events = detections
    .filter(d => d.cameraId === cameraId)
    .sort((a, b) => new Date(b.ts) - new Date(a.ts));

  const uniquePlates = [...new Set(events.map(e => e.plate))];

  const plateList = uniquePlates.map(plate => ({
    plate,
    meta: vehicleMetadata[plate] || null,
    sightings: events
      .filter(e => e.plate === plate)
      .map(e => e.ts),
  }));

  // Hourly distribution (0-23)
  const hourly = Array(24).fill(0);
  events.forEach(e => {
    const h = new Date(e.ts).getUTCHours();
    hourly[h]++;
  });

  return {
    camera: cam,
    totalDetections: events.length,
    uniqueVehicles: uniquePlates.length,
    flaggedCount: plateList.filter(p => p.meta?.flagged).length,
    latestDetection: events[0]?.ts ?? null,
    plateList,
    hourly,
  };
}

/** Return summary stats for all cameras (for the global overview). */
export function getAllCameraStats() {
  return cameras.map(cam => {
    const events = detections.filter(d => d.cameraId === cam.id);
    return {
      ...cam,
      totalDetections: events.length,
      uniqueVehicles: new Set(events.map(e => e.plate)).size,
      flagged: events.filter(e => vehicleMetadata[e.plate]?.flagged).length,
    };
  });
}
