import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DashboardLayout from "../../components/erp/parent/DashboardLayout";
import { useParent } from "../../context/ParentProvider";
import { getChildrenLocations, getChildLocation, getChildPicture } from "../../services/parentAPIs";

/* ─── Fix Leaflet default icons ───────────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* ─── Avatar marker icon — circular profile photo with pulsing ring ─────────
   Falls back to initials on a colored circle if no picture is available.

   ANCHOR FIX: the pin's point is a 38px square rotated 45deg with one sharp
   corner (border-radius: 50% 50% 0% 50%) — that's what makes it come to a
   point. The tip of that point sits below the square's own center by its
   half-diagonal: 19 * sqrt(2) ≈ 26.87px, rounded up to 27px here.
   Previously the container was only 46px tall with iconAnchor at its exact
   center [23,23] — the tip was never actually at the anchor, so the pin was
   pointing about 27px away from the real coordinate. Now the container is
   made tall enough to contain the full tip (54px), the ping circle and pin
   are pinned to fixed pixel positions (not percentages) so they don't shift
   when the container grows, and iconAnchor/popupAnchor are recalculated to
   match the tip's true pixel position. The photo/pin visuals themselves are
   unchanged. */
const makeAvatarIcon = (avatarSrc, initials = "?", color = "#3b82f6") => {
  const inner = avatarSrc
    ? `<img src="${avatarSrc}" crossorigin="anonymous" style="
         width:100%;height:100%;object-fit:cover;border-radius:50%;display:block; transform: rotate(-45deg);
       " />`
    : `<div style="
         width:100%;height:100%;border-radius:50%;
         background:${color};
         display:flex;align-items:center;justify-content:center;
         color:#fff;font-weight:700;font-size:15px;font-family:system-ui,sans-serif;
       ">${initials}</div>`;

  const PIN_CENTER = 23;        // center of the ping circle / pin square (unchanged from before)
  const TIP_OFFSET = 27;        // half-diagonal of the 38px pin square, rounded up
  const TIP_Y = PIN_CENTER + TIP_OFFSET; // 50 — exact pixel row where the pin's point sits

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:46px;height:${TIP_Y}px;">
        <div style="
          position:absolute;
          top:0;left:0;
          width:46px;height:46px;
          background:${color}40;
          border-radius:50%;
          animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <div
          style="
            position:absolute;
            top:${PIN_CENTER}px;
            left:${PIN_CENTER}px;
            transform:translate(-50%, -50%) rotate(45deg);
            width:38px;
            height:38px;
            border-radius: 50% 50% 0% 50%;
            border:1px solid blue ;
            box-shadow:0 2px 10px ${color}80;
            overflow:hidden;
            background:#e2e8f0;
          "
        >
          ${inner}
        </div>
      </div>
      <style>@keyframes ping{75%,100%{transform:scale(1.9);opacity:0}}</style>
    `,
    iconSize: [46, TIP_Y],
    iconAnchor: [23, TIP_Y],   // pin's point now lands exactly on the coordinate
    popupAnchor: [0, -TIP_Y],
  });
};

/* ─── Auto-fly sub-component ─────────────────────────────────────────────── */
function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.4 });
  }, [position, map]);
  return null;
}

/* ─── Heading arrow helper ───────────────────────────────────────────────── */
function HeadingArrow({ heading }) {
  if (heading === null || heading === undefined) return null;
  return (
    <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold" title={`Heading: ${Math.round(heading)}°`}>
      <span
        className="material-symbols-outlined text-base"
        style={{ transform: `rotate(${heading}deg)`, display: "inline-block" }}
      >
        navigation
      </span>
      {Math.round(heading)}°
    </div>
  );
}

/* ─── Skeleton (initial full-page load) ──────────────────────────────────── */
function TrackStudentSkeleton() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-gray-300 dark:bg-slate-700 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 h-16" />
          ))}
        </div>
        <div className="rounded-xl bg-gray-200 dark:bg-slate-700 h-[480px] flex items-center justify-center">
          <span className="material-symbols-outlined text-6xl text-gray-400">map</span>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── Map-only skeleton (child switch / manual refresh) ──────────────────── */
function MapLoadingState() {
  return (
    <div className="h-[480px] bg-gray-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 animate-pulse">
      <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-slate-600">map</span>
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading location…</p>
    </div>
  );
}

/* ─── No device state ────────────────────────────────────────────────────── */
function NoDeviceState({ studentName }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-slate-500">location_off</span>
      </div>
      <div>
        <p className="text-base font-bold text-on-surface dark:text-white">No Device Registered</p>
        <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1 max-w-sm">
          {studentName} doesn't have a device linked yet. Contact the school to register a device for location tracking.
        </p>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 max-w-sm text-left">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-500 text-base mt-0.5 flex-shrink-0">info</span>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            To enable tracking, the student's phone needs to have the school app installed and location permissions enabled.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Unauthorized state ─────────────────────────────────────────────────── */
function UnauthorizedState({ studentName }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="material-symbols-outlined text-4xl text-amber-400">lock</span>
      <p className="text-sm font-bold text-on-surface dark:text-white">Location Access Not Enabled</p>
      <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-sm">
        You don't have permission to view {studentName}'s location. Contact the school to enable tracking access.
      </p>
    </div>
  );
}

/* ─── Child selector tabs ────────────────────────────────────────────────── */
function ChildTabs({ childrenOverview, selectedId, onSelect }) {
  if (!childrenOverview || childrenOverview.length <= 1) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {childrenOverview.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
            ${selectedId === c.id
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-white dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary/40"
            }`}
        >
          <span className="material-symbols-outlined text-sm">child_care</span>
          {c.name}
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.has_device ? "bg-green-400" : "bg-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */
const TrackStudent = () => {
  const { students, activeChildId, switchChild } = useParent();

  const [childrenOverview, setChildrenOverview] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [loading, setLoading] = useState(true);            // initial page load
  const [childLoading, setChildLoading] = useState(false);  // per-child location fetch
  const [refreshing, setRefreshing] = useState(false);      // manual refresh spinner
  const [error, setError] = useState(null);
  const [avatarSrc, setAvatarSrc] = useState(null);         // signed profile picture URL for marker
  const intervalRef = useRef(null);
  const hasInitializedSelection = useRef(false);

  /* ── Initial load: overview of all children locations ── */
  useEffect(() => {
    const loadOverview = async () => {
      try {
        const overview = await getChildrenLocations();
        setChildrenOverview(overview);

        if (!hasInitializedSelection.current) {
          hasInitializedSelection.current = true;
          // Prefer the globally active child if it has a device, else first child with a device
          const activeHasDevice = overview.find(c => c.id === activeChildId && c.has_device);
          const firstWithDevice = overview.find(c => c.has_device);
          setSelectedChildId(activeHasDevice?.id || firstWithDevice?.id || activeChildId || overview[0]?.id || null);
        }
      } catch (err) {
        console.error("Failed to load children locations overview:", err);
        setError("Could not load location overview.");
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [activeChildId]);

  /* ── Stay in sync if global active child changes elsewhere (e.g. ChildSelector) ── */
  useEffect(() => {
    if (!activeChildId || !hasInitializedSelection.current) return;
    if (activeChildId !== selectedChildId) {
      setSelectedChildId(activeChildId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChildId]);

  /* ── Fetch single child location data ── */
  const fetchChildLocation = useCallback(async (childId, isManualRefresh = false) => {
    if (!childId) return;
    if (isManualRefresh) setRefreshing(true);
    else setChildLoading(true);
    try {
      const data = await getChildLocation(childId, { days: 7, limit: 50 });
      setLocationData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch child location:", err);
      setError("Could not fetch location data.");
    } finally {
      if (isManualRefresh) setRefreshing(false);
      else setChildLoading(false);
    }
  }, []);

  /* ── When selected child changes, reload location + profile picture ──
     Picture URL is pre-signed (~1hr validity), fetched fresh each time the
     child changes so the marker never shows a stale/expired image link. */
  useEffect(() => {
    if (!selectedChildId) return;
    setLocationData(null);
    setAvatarSrc(null);
    fetchChildLocation(selectedChildId);

    let cancelled = false;
    getChildPicture(selectedChildId)
      .then((res) => {
        if (!cancelled && res?.has_picture && res?.url) {
          setAvatarSrc(res.url);
        }
      })
      .catch((err) => console.error("Failed to fetch child picture:", err));

    return () => { cancelled = true; };
  }, [selectedChildId, fetchChildLocation]);

  /* ── Auto-refresh every 30s when tracking is on (location only, not picture) ── */
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (isTracking && selectedChildId) {
      intervalRef.current = setInterval(() => {
        fetchChildLocation(selectedChildId);
      }, 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTracking, selectedChildId, fetchChildLocation]);

  /* ── Handle child tab switch ── */
  const handleSelectChild = (childId) => {
    if (childId === selectedChildId) return;
    setSelectedChildId(childId);
    switchChild(childId); // sync with global parent context
  };

  /* ── Derived values ── */
  const currentChildOverview = childrenOverview.find(c => c.id === selectedChildId) || null;
  const studentName = currentChildOverview?.name || students.find(s => s.id === selectedChildId)?.name || "Student";
  const hasDevice = currentChildOverview?.has_device ?? false;

  const isUnauthorized = locationData?.unauthorized === true;
  const noDeviceFromDetail = locationData?.detail === "No device registered for this child.";
  const showNoDevice = !isUnauthorized && (!hasDevice || noDeviceFromDetail);

  const currentLocation = locationData?.current_location || null;
  const deviceInfo = locationData?.device_info || currentChildOverview?.device_info || null;
  const recentHistory = locationData?.recent_history || [];

  // current_location gives floats already, but guard with parseFloat anyway
  const position = currentLocation
    ? [parseFloat(currentLocation.latitude), parseFloat(currentLocation.longitude)]
    : null;

  // recent_history gives lat/lng as strings — must parseFloat before mapping
  const historyPoints = recentHistory
    .map(h => [parseFloat(h.latitude), parseFloat(h.longitude)])
    .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
    .reverse(); // oldest → newest

  const latestHistory = recentHistory[0] || null;
  const speed = latestHistory?.speed ?? null;
  const heading = latestHistory?.heading ?? null;
  const altitude = latestHistory?.altitude ?? null;

  const lastUpdated = currentLocation?.timestamp || deviceInfo?.last_updated || null;
  const formatTime = (ts) => ts
    ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";
  const formatDateTime = (ts) => ts
    ? new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "—";

  const getStatus = () => {
    if (!deviceInfo?.is_active) return { label: "Device Offline", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
    if (!lastUpdated) return { label: "No Signal", cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
    const minsAgo = (Date.now() - new Date(lastUpdated)) / 60000;
    if (minsAgo < 5) return { label: "Live", cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" };
    if (minsAgo < 30) return { label: "Recent", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    return { label: "Last Seen", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" };
  };
  const status = getStatus();

  // Initials fallback for the marker when no picture is available
  const initials = useMemo(() => {
    return studentName
      .split(" ")
      .filter(Boolean)
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  }, [studentName]);

  // Rebuild the marker icon whenever the avatar or initials change
  const avatarIcon = useMemo(
    () => makeAvatarIcon(avatarSrc, initials, "#3b82f6"),
    [avatarSrc, initials]
  );

  if (loading) return <TrackStudentSkeleton />;

  return (
    <DashboardLayout>
      <style>{`@keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}`}</style>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
              Track Student
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Real-time location of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{studentName}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchChildLocation(selectedChildId, true)}
              disabled={refreshing || !hasDevice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <span className={`material-symbols-outlined text-base ${refreshing ? "animate-spin" : ""}`}>refresh</span>
              Refresh
            </button>

            <button
              onClick={() => setIsTracking(v => !v)}
              disabled={!hasDevice}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40
                ${isTracking
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              <span className="material-symbols-outlined text-base">
                {isTracking ? "pause_circle" : "play_circle"}
              </span>
              {isTracking ? "Pause" : "Resume"} Tracking
            </button>
          </div>
        </div>

        <ChildTabs childrenOverview={childrenOverview} selectedId={selectedChildId} onSelect={handleSelectChild} />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            {error}
            <button onClick={() => fetchChildLocation(selectedChildId, true)} className="ml-auto text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}

        {childLoading ? (
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-700">
            <MapLoadingState />
          </div>
        ) : isUnauthorized ? (
          <UnauthorizedState studentName={studentName} />
        ) : showNoDevice ? (
          <NoDeviceState studentName={studentName} />
        ) : (
          <>
            {/* ── Status cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`rounded-xl border p-3 ${status.cls}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot} ${status.label === "Live" ? "animate-pulse" : ""}`} />
                  <span className="text-sm font-semibold">{status.label}</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Device</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{deviceInfo?.device_name || "—"}</p>
                <p className="text-xs text-gray-400">{deviceInfo?.device_type || ""}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coordinates</p>
                {position ? (
                  <>
                    <p className="text-xs font-mono font-semibold text-gray-800 dark:text-white">{position[0].toFixed(5)}</p>
                    <p className="text-xs font-mono text-gray-500">{position[1].toFixed(5)}</p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-gray-400">No data</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white tabular-nums">
                  {lastUpdated ? formatTime(lastUpdated) : "—"}
                </p>
                {altitude !== null && <p className="text-xs text-gray-400">{Math.round(altitude)}m altitude</p>}
              </div>
            </div>

            {(speed !== null || heading !== null) && (
              <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2.5">
                {speed !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                    <span className="material-symbols-outlined text-base">speed</span>
                    <span className="font-semibold">{speed ? `${(speed * 3.6).toFixed(1)} km/h` : "Stationary"}</span>
                  </div>
                )}
                {heading !== null && <HeadingArrow heading={heading} />}
                {isTracking && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Auto-refreshing every 30s
                  </div>
                )}
              </div>
            )}

            {/* ── Map ── */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-700">
              {!position ? (
                <div className="h-[480px] bg-gray-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500">
                  <span className="material-symbols-outlined text-5xl">location_searching</span>
                  <p className="text-sm font-medium">Waiting for location signal…</p>
                  <p className="text-xs">The device may be offline or hasn't reported yet.</p>
                </div>
              ) : (
                <MapContainer center={position} zoom={15} style={{ height: "480px", width: "100%" }} scrollWheelZoom>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {currentLocation?.accuracy && (
                    <Circle
                      center={position}
                      radius={currentLocation.accuracy}
                      pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.1, weight: 1 }}
                    />
                  )}

                  {historyPoints.length > 1 && (
                    <Polyline positions={historyPoints} pathOptions={{ color: "#93c5fd", weight: 3, opacity: 0.6, dashArray: "6 4" }} />
                  )}

                  {/* Profile-photo marker (circular avatar with pulsing ring) */}
                  <Marker position={position} icon={avatarIcon}>
                    <Popup>
                      <div className="text-sm min-w-[160px]">
                        <p className="font-bold text-gray-900 mb-1">{studentName}</p>
                        <p className="text-gray-500 text-xs">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
                        {lastUpdated && <p className="text-gray-400 text-xs mt-1">Updated {formatDateTime(lastUpdated)}</p>}
                        {speed !== null && (
                          <p className="text-blue-600 text-xs mt-1 font-medium">
                            {speed ? `${(speed * 3.6).toFixed(1)} km/h` : "Stationary"}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  <FlyToPosition position={position} />
                </MapContainer>
              )}
            </div>

            {/* ── Location history ── */}
            {recentHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location History</h2>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{recentHistory.length} records</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-700/60 max-h-64 overflow-y-auto">
                  {recentHistory.map((h, i) => (
                    <div key={h.id || i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {parseFloat(h.latitude).toFixed(5)}, {parseFloat(h.longitude).toFixed(5)}
                        </p>
                        {h.heading != null && <p className="text-2xs text-gray-400">{Math.round(h.heading)}° heading</p>}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 tabular-nums">{formatTime(h.location_time)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── All children overview table ── */}
            {childrenOverview.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Children</h2>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-700/60">
                  {childrenOverview.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectChild(c.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${c.id === selectedChildId ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                        ${c.id === selectedChildId ? "bg-primary text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300"}`}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{c.enrollment_number}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {c.has_device ? (
                          <>
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Device Active
                            </span>
                            {c.last_location?.timestamp && (
                              <p className="text-2xs text-gray-400 mt-0.5">{formatDateTime(c.last_location.timestamp)}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">No device</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">
              Location data is fetched from the student's registered device.
              {isTracking ? " Auto-refreshing every 30 seconds." : " Auto-refresh paused."}
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrackStudent;