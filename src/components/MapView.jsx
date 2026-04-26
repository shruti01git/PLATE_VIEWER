import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import data from '../data/Data';
import { useMemo, useEffect, useState } from "react";

// Fix default marker icons in Leaflet bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

function FitBounds({ events }) {
  const map = useMap();
  const bounds = useMemo(() => {
    if (!events || events.length === 0) return null;
    return L.latLngBounds(events.map(e => [e.lat, e.lng]));
  }, [events]);
  useEffect(() => { if (bounds) map.fitBounds(bounds.pad(0.2), { animate: false }); }, [bounds, map]);
  return null;
}

export default function MapView({ events, query }) {
  const center = events?.[0] ? [events[0].lat, events[0].lng] : [19.076, 72.8777];
  const positions = (events || []).map(e => [e.lat, e.lng]);

  // Road-snapped route state
  const [routeCoords, setRouteCoords] = useState(null);   // [[lat,lng], ...]
  const [routeErr, setRouteErr] = useState(null);

  useEffect(() => {
    setRouteCoords(null);
    setRouteErr(null);
    if (!events || events.length < 2) return;

    // OSRM expects "lng,lat" pairs separated by ";"
    const coordString = events.map(e => `${e.lng},${e.lat}`).join(";");

    const ctrl = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}` +
                `?alternatives=false&overview=full&geometries=geojson&steps=false`;

    fetch(url, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data.code !== "Ok" || !data.routes?.[0]) {
          setRouteErr("No route found");
          return;
        }
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(coords);
      })
      .catch(err => {
        if (err.name !== "AbortError") setRouteErr(err.message || "Routing failed");
      });

    return () => ctrl.abort();
  }, [events]);

  return (
    <div style={{ height: 420, borderTop: "1px solid #eee", marginTop: 12 }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {events && events.map(e => (
          <Marker key={`${e.cameraId}-${e.ts}`} position={[e.lat, e.lng]}>
            <Popup>
              <div style={{fontWeight:600}}>{e.name}</div>
              <div style={{fontSize:12, opacity:0.8}}>
                {e.cameraId}<br/>
                {new Date(e.ts).toLocaleString()}<br/>
                lat {e.lat.toFixed(4)}, lng {e.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}

        {routeCoords
          ? <Polyline positions={routeCoords} />
          // fallback: dashed straight segments if routing fails or not enough points
          : positions.length >= 2 && (
              <Polyline positions={positions} pathOptions={{ dashArray: "6 6" }} />
            )
        }

        <FitBounds events={events} />
      </MapContainer>

      <div style={{ padding: "8px 12px", fontSize: 13, color: routeErr ? "#a00" : "#555",
                    background: "#fff", borderBottom: "1px solid #eee" }}>
        {query
          ? routeErr ? `Route error: ${routeErr}` : `Route for: ${query}`
          : "Search a plate to view route"}
      </div>
    </div>
  );
}
