import { useState, useMemo, useCallback } from "react";
import SearchBar from "./components/SearchBar.jsx";
import CameraList from "./components/CameraList.jsx";
import MapView from "./components/MapView.jsx";
import CameraAnalyticsPanel from "./components/CameraAnalyticsPanel.jsx";
import { getJourneyForPlate, getCameraAnalytics, getAllCameraStats } from "./data.js";

export default function App() {
  const [query,          setQuery]          = useState("");
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [mode,           setMode]           = useState("journey"); // "journey" | "camera"

  const events       = useMemo(() => (query ? getJourneyForPlate(query) : []), [query]);
  const cameraData   = useMemo(() => (activeCameraId ? getCameraAnalytics(activeCameraId) : null), [activeCameraId]);
  const allCamStats  = useMemo(() => getAllCameraStats(), []);

  const handleCameraClick = useCallback((camId) => {
    setActiveCameraId(camId);
    setMode("camera");
  }, []);

  const handleClosePanel = useCallback(() => {
    setActiveCameraId(null);
    setMode("journey");
  }, []);

  const handleSelectPlate = useCallback((plate) => {
    setQuery(plate);
    setMode("journey");
    setActiveCameraId(null);
  }, []);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (q) {
      setMode("journey");
      setActiveCameraId(null);
    }
  }, []);

  // Global stats
  const totalDetections  = allCamStats.reduce((s, c) => s + c.totalDetections,  0);
  const totalUniqueVeh   = new Set(allCamStats.flatMap(() => [])).size; // computed below
  const flaggedCount     = allCamStats.reduce((s, c) => s + c.flagged, 0);

  return (
    <div style={styles.page}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header style={styles.topBar}>
        <div style={styles.brand}>
          <div style={styles.brandLogo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <div style={styles.brandName}>CONNECTED INTELLIGENCE</div>
            <div style={styles.brandSub}>City-Scale Vehicle Tracking · Phase 2</div>
          </div>
        </div>

        <div style={styles.globalStats}>
          <StatPill label="CAMERAS"    value={allCamStats.length} color="#3b82f6" />
          <StatPill label="DETECTIONS" value={totalDetections}    color="#10b981" />
          <StatPill label="FLAGGED"    value={flaggedCount}       color="#ef4444" />
        </div>

        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, ...(mode === "journey" ? styles.modeBtnActive : {}) }}
            onClick={() => { setMode("journey"); setActiveCameraId(null); }}
          >
            Journey
          </button>
          <button
            style={{ ...styles.modeBtn, ...(mode === "camera" ? styles.modeBtnActive : {}) }}
            onClick={() => setMode("camera")}
            disabled={!activeCameraId}
          >
            Camera
          </button>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <SearchBar value={query} onChange={handleSearch} />

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div style={styles.grid}>
        {/* Left panel — switches between Journey trace and Camera analytics */}
        <div style={styles.left}>
          {mode === "camera" && cameraData ? (
            <CameraAnalyticsPanel
              analytics={cameraData}
              onClose={handleClosePanel}
              onSelectPlate={handleSelectPlate}
            />
          ) : (
            <CameraList events={events} query={query} />
          )}
        </div>

        {/* Right panel — always the map */}
        <div style={styles.right}>
          <MapView
            events={events}
            query={query}
            onCameraClick={handleCameraClick}
            activeCameraId={activeCameraId}
          />
        </div>
      </div>

      {/* ── Help tooltip strip ──────────────────────────────────────────── */}
      <div style={styles.helpBar}>
        <span> Click any camera marker on the map to open analytics</span>
        <span style={styles.helpSep}>·</span>
        <span> Search a plate number to trace its full city journey</span>
        <span style={styles.helpSep}>·</span>
        <span>  Red cameras have flagged vehicles</span>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={styles.statPill}>
      <div style={{ ...styles.statPillValue, color }}>{value}</div>
      <div style={styles.statPillLabel}>{label}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080e1a",
    color: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#0d1117",
    borderBottom: "1px solid #1e293b",
    flexWrap: "wrap",
    gap: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brandLogo: {
    width: 40,
    height: 40,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#f1f5f9",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  brandSub: {
    fontSize: 10,
    color: "#475569",
    letterSpacing: "0.06em",
    fontFamily: "monospace",
    marginTop: 2,
  },
  globalStats: {
    display: "flex",
    gap: 8,
  },
  statPill: {
    textAlign: "center",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "6px 14px",
    minWidth: 70,
  },
  statPillValue: {
    fontSize: 18,
    fontWeight: 800,
    fontFamily: "monospace",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  statPillLabel: {
    fontSize: 8,
    color: "#475569",
    letterSpacing: "0.1em",
    marginTop: 3,
    fontFamily: "monospace",
  },
  modeToggle: {
    display: "flex",
    gap: 4,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 3,
  },
  modeBtn: {
    padding: "6px 14px",
    fontSize: 12,
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    background: "transparent",
    color: "#64748b",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.03em",
  },
  modeBtnActive: {
    background: "#1d4ed8",
    color: "#fff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 400px) 1fr",
    gap: 12,
    padding: 12,
    flex: 1,
    alignItems: "start",
  },
  left: {
    position: "sticky",
    top: 110,
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#334155 transparent",
  },
  right: {
    height: "calc(100vh - 120px)",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #1e293b",
  },
  helpBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "8px 20px",
    fontSize: 11,
    color: "#334155",
    background: "#0d1117",
    borderTop: "1px solid #1e293b",
    fontFamily: "monospace",
    flexWrap: "wrap",
  },
  helpSep: {
    color: "#1e293b",
  },
};
