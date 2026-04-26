import { useEffect, useRef } from "react";

const TYPE_COLORS = {
  Car: "#3b82f6",
  SUV: "#8b5cf6",
  Truck: "#f59e0b",
  Bike: "#10b981",
  Van: "#ef4444",
  default: "#6b7280",
};

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || TYPE_COLORS.default;
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 7px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: "monospace",
      letterSpacing: "0.04em",
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
    }}>
      {type || "Unknown"}
    </span>
  );
}

function FlagBadge() {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      padding: "1px 7px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: "#ef444422",
      color: "#ef4444",
      border: "1px solid #ef444444",
    }}>
      ⚑ FLAGGED
    </span>
  );
}

function HourlyBar({ hourly }) {
  const max = Math.max(...hourly, 1);
  const peakHour = hourly.indexOf(Math.max(...hourly));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 6, fontFamily: "monospace" }}>
        HOURLY TRAFFIC DISTRIBUTION
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 48 }}>
        {hourly.map((count, h) => (
          <div
            key={h}
            title={`${h}:00 — ${count} vehicle${count !== 1 ? "s" : ""}`}
            style={{
              flex: 1,
              height: `${Math.max((count / max) * 100, count > 0 ? 8 : 2)}%`,
              minHeight: count > 0 ? 3 : 1,
              background: h === peakHour && count > 0
                ? "#f59e0b"
                : count > 0
                  ? "#3b82f680"
                  : "#1e293b",
              borderRadius: 2,
              transition: "height 0.3s ease",
              cursor: count > 0 ? "help" : "default",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555", marginTop: 3, fontFamily: "monospace" }}>
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

export default function CameraAnalyticsPanel({ analytics, onClose, onSelectPlate }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [analytics?.camera?.id]);

  if (!analytics) return null;

  const { camera, totalDetections, uniqueVehicles, flaggedCount, latestDetection, plateList, hourly } = analytics;

  return (
    <div ref={panelRef} style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.camDot} />
          <div>
            <div style={styles.camName}>{camera.name}</div>
            <div style={styles.camId}>{camera.id} · {camera.zone}</div>
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn} title="Close">✕</button>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard label="DETECTIONS" value={totalDetections} accent="#3b82f6" />
        <StatCard label="VEHICLES" value={uniqueVehicles} accent="#10b981" />
        <StatCard label="FLAGGED" value={flaggedCount} accent={flaggedCount > 0 ? "#ef4444" : "#6b7280"} />
      </div>

      {latestDetection && (
        <div style={styles.lastSeen}>
          <span style={{ color: "#888" }}>Last detection:</span>{" "}
          <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: 12 }}>
            {new Date(latestDetection).toLocaleString()}
          </span>
        </div>
      )}

      {/* Hourly chart */}
      <div style={styles.section}>
        <HourlyBar hourly={hourly} />
      </div>

      {/* Vehicle list */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>DETECTED VEHICLES</div>
        <div style={styles.vehicleList}>
          {plateList.map(({ plate, meta, sightings }) => (
            <div key={plate} style={styles.vehicleCard}>
              <div style={styles.vehicleTop}>
                <div style={styles.plateChip}>
                  <span style={styles.plateText}>{plate}</span>
                  {meta?.flagged && <FlagBadge />}
                </div>
                <button
                  onClick={() => onSelectPlate(plate)}
                  style={styles.trackBtn}
                  title="Track full journey"
                >
                  Track →
                </button>
              </div>

              {meta && (
                <div style={styles.metaRow}>
                  <TypeBadge type={meta.type} />
                  <span style={styles.metaText}>{meta.color} {meta.make} {meta.model}</span>
                </div>
              )}

              <div style={styles.sightingsRow}>
                {sightings.map((ts, i) => (
                  <span key={i} style={styles.tsChip}>
                    {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                ))}
                <span style={styles.sightingCount}>{sightings.length}× seen</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...styles.statCard, borderColor: accent + "44" }}>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  panel: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    overflowY: "auto",
    maxHeight: "calc(100vh - 120px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px 16px 12px",
    borderBottom: "1px solid #1e293b",
    background: "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
    borderRadius: "12px 12px 0 0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  camDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
    flexShrink: 0,
    animation: "pulse 2s infinite",
  },
  camName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "0.01em",
  },
  camId: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    letterSpacing: "0.05em",
  },
  closeBtn: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#64748b",
    borderRadius: 6,
    width: 28,
    height: 28,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    transition: "all 0.15s",
    flexShrink: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    background: "#1e293b",
    borderBottom: "1px solid #1e293b",
  },
  statCard: {
    padding: "12px 10px",
    background: "#0f172a",
    textAlign: "center",
    border: "0",
    borderTop: "3px solid transparent",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: {
    fontSize: 9,
    color: "#475569",
    marginTop: 4,
    letterSpacing: "0.1em",
  },
  lastSeen: {
    padding: "8px 16px",
    fontSize: 12,
    borderBottom: "1px solid #1e293b",
    background: "#0d1a2e",
  },
  section: {
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
  },
  sectionTitle: {
    fontSize: 10,
    color: "#475569",
    letterSpacing: "0.12em",
    marginBottom: 10,
    fontWeight: 600,
  },
  vehicleList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  vehicleCard: {
    padding: "10px 12px",
    background: "#1e293b",
    borderRadius: 8,
    border: "1px solid #334155",
    transition: "border-color 0.15s",
  },
  vehicleTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  plateChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  plateText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "0.08em",
    background: "#0f172a",
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid #334155",
  },
  trackBtn: {
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 600,
    background: "transparent",
    border: "1px solid #3b82f6",
    color: "#3b82f6",
    borderRadius: 5,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.03em",
    transition: "all 0.15s",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#94a3b8",
  },
  sightingsRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  tsChip: {
    fontSize: 11,
    fontFamily: "monospace",
    background: "#0f172a",
    color: "#94a3b8",
    padding: "2px 6px",
    borderRadius: 3,
    border: "1px solid #1e293b",
  },
  sightingCount: {
    fontSize: 10,
    color: "#475569",
    marginLeft: 2,
  },
};
