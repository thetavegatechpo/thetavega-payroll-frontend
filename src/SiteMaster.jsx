
import React, {
  useEffect,
  useRef,
  useState
} from "react";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { api, errorText } from "./api.js";

// ======================================================
// DEFAULT FORM
// ======================================================

const makeEmpty = () => ({
  code: "",
  customerName: "",
  name: "",
  city: "",
  state: "",
  address: "",
  distanceKm: 0,
  reportingTime: "09:30",
  taPolicy: "NONE",
  fixedDailyTA: 0,
  gps: {
    latitude: null,
    longitude: null,
    radiusMeters: 200
  },
  active: true
});

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  color: "#0f172a"
};

const btnStyle = {
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600
};

const DEFAULT_CENTER = [20.5937, 78.9629];

const validCoordinates = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const roundCoordinate = value =>
  Number(Number(value).toFixed(7));

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function SiteMaster() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(makeEmpty);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [locating, setLocating] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const lastSearchAtRef = useRef(0);

  // ====================================================
  // LOAD EXISTING SITES
  // ====================================================

  async function load() {
    try {
      const response = await api.get("/sites");
      setRows(response.data);
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ====================================================
  // FORM HELPERS
  // ====================================================

  function update(key, value) {
    setForm(old => ({
      ...old,
      [key]: value
    }));
  }

  function updateGps(key, value) {
    setForm(old => ({
      ...old,
      gps: {
        ...old.gps,
        [key]: value
      }
    }));
  }

  function chooseLocation(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!validCoordinates(lat, lng)) {
      setError("Invalid map coordinates.");
      return;
    }

    setForm(old => ({
      ...old,
      gps: {
        ...old.gps,
        latitude: roundCoordinate(lat),
        longitude: roundCoordinate(lng)
      }
    }));

    setError("");
  }

  // ====================================================
  // INITIALIZE MAP
  // ====================================================

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 5,
      scrollWheelZoom: false
    });

    mapRef.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }
    ).addTo(map);

    map.on("click", event => {
      chooseLocation(
        event.latlng.lat,
        event.latlng.lng
      );
    });

    const resize = () => {
      map.invalidateSize();
    };

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  // ====================================================
  // SYNCHRONIZE MAP WITH FORM
  // ====================================================

  const latitude = form.gps.latitude;
  const longitude = form.gps.longitude;
  const radiusMeters = Number(form.gps.radiusMeters);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!validCoordinates(latitude, longitude)) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      return;
    }

    const point = [latitude, longitude];

    if (!markerRef.current) {
      const markerIcon = L.divIcon({
        className: "",
        html:
          '<div style="width:20px;height:20px;' +
          "background:#ea580c;border:3px solid white;" +
          "border-radius:50%;box-shadow:0 2px 8px #0005;" +
          '"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker(point, {
        draggable: true,
        icon: markerIcon
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();

        chooseLocation(
          position.lat,
          position.lng
        );
      });

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(point);
    }

    const safeRadius =
      Number.isFinite(radiusMeters) &&
      radiusMeters > 0
        ? radiusMeters
        : 200;

    if (!circleRef.current) {
      circleRef.current = L.circle(point, {
        radius: safeRadius,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 2
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(point);
      circleRef.current.setRadius(safeRadius);
    }
  }, [latitude, longitude, radiusMeters]);

  // ====================================================
  // CENTER MAP ON GPS
  // ====================================================

  function focusMap(lat, lng, zoom = 17) {
    mapRef.current?.setView(
      [lat, lng],
      zoom
    );
  }

  // ====================================================
  // SEARCH LOCATION
  // ====================================================

  async function searchLocation() {
    const query = searchText.trim();

    if (query.length < 3) {
      setError(
        "Enter at least 3 characters to search."
      );
      return;
    }

    // Limit requests to the public search service.
    if (
      Date.now() - lastSearchAtRef.current <
      1200
    ) {
      setError(
        "Please wait before searching again."
      );
      return;
    }

    lastSearchAtRef.current = Date.now();
    setSearching(true);
    setError("");
    setSearchResults([]);

    try {
      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=jsonv2&limit=5&countrycodes=in" +
        "&q=" + encodeURIComponent(query);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Map search failed (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || !data.length) {
        setError(
          "No matching location found. " +
          "Try a nearby landmark or full address."
        );
        return;
      }

      setSearchResults(data);
    } catch (e) {
      setError(
        e.message ||
        "Unable to search location."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(result) {
    const lat = Number(result.lat);
    const lng = Number(result.lon);

    chooseLocation(lat, lng);
    focusMap(lat, lng);

    setSearchText(result.display_name);
    setSearchResults([]);
  }

  // ====================================================
  // USE CURRENT LOCATION
  // ====================================================

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "GPS location is not supported by this browser."
      );
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        chooseLocation(lat, lng);
        focusMap(lat, lng);

        setMessage(
          "Current location captured. " +
          `GPS accuracy approximately ${Math.round(accuracy)} metres. ` +
          "Confirm the pin before saving."
        );

        setLocating(false);
      },
      geoError => {
        setLocating(false);

        setError(
          "Unable to capture current location: " +
          geoError.message +
          ". Enable browser location permission and retry."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  // ====================================================
  // EDIT EXISTING SITE
  // ====================================================

  function start(row) {
    setEdit(row._id);

    const lat =
      typeof row.gps?.latitude === "number"
        ? row.gps.latitude
        : null;

    const lng =
      typeof row.gps?.longitude === "number"
        ? row.gps.longitude
        : null;

    setForm({
      code: row.code ?? "",
      customerName: row.customerName ?? "",
      name: row.name ?? "",
      city: row.city ?? "",
      state: row.state ?? "",
      address: row.address ?? "",
      distanceKm: row.distanceKm ?? 0,
      reportingTime: row.reportingTime ?? "09:30",
      taPolicy: row.taPolicy ?? "NONE",
      fixedDailyTA: row.fixedDailyTA ?? 0,
      gps: {
        latitude: lat,
        longitude: lng,
        radiusMeters:
          row.gps?.radiusMeters ?? 200
      },
      active: row.active ?? true
    });

    setError("");
    setMessage("");
    setSearchText("");
    setSearchResults([]);

    if (validCoordinates(lat, lng)) {
      focusMap(lat, lng);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function resetForm() {
    setEdit(null);
    setForm(makeEmpty());
    setSearchText("");
    setSearchResults([]);
  }

  // ====================================================
  // SAVE SITE
  // ====================================================

  async function save(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    const lat = form.gps.latitude;
    const lng = form.gps.longitude;
    const radius = Number(form.gps.radiusMeters);

    // Active sites need a configured GPS location
    // for strict attendance.
    if (
      form.active &&
      !validCoordinates(lat, lng)
    ) {
      setError(
        "Please select a site location on the map " +
        "before activating the site."
      );
      return;
    }

    if (
      !Number.isFinite(radius) ||
      radius < 50 ||
      radius > 10000
    ) {
      setError(
        "GPS radius must be between 50 and 10000 metres."
      );
      return;
    }

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      fixedDailyTA: Number(form.fixedDailyTA),
      distanceKm: Number(form.distanceKm),
      gps: {
        latitude: validCoordinates(lat, lng)
          ? lat
          : null,
        longitude: validCoordinates(lat, lng)
          ? lng
          : null,
        radiusMeters: radius
      }
    };

    setSaving(true);

    try {
      if (edit) {
        await api.patch(
          "/sites/" + edit,
          payload
        );
      } else {
        await api.post(
          "/sites",
          payload
        );
      }

      setMessage(
        edit
          ? "Site updated successfully."
          : "Site created successfully."
      );

      resetForm();
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  // ====================================================
  // FORM FIELD
  // ====================================================

  const field = (
    key,
    label,
    required = true
  ) => (
    <label
      key={key}
      style={{
        display: "grid",
        gap: 5,
        fontWeight: 600
      }}
    >
      {label}

      <input
        style={inputStyle}
        required={required}
        value={form[key]}
        onChange={e =>
          update(key, e.target.value)
        }
      />
    </label>
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gap: 20
      }}
    >
      <div>
        <h1>Site Master</h1>
        <p>
          Customer sites, reporting times,
          travel allowance policies and GPS
          attendance locations.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          style={{ color: "#b91c1c" }}
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{ color: "#15803d" }}
        >
          {message}
        </p>
      )}

      {/* ==========================================
          CREATE / EDIT SITE
      ========================================== */}

      <form
        onSubmit={save}
        style={{
          background: "var(--card,#fff)",
          padding: 20,
          borderRadius: 12,
          display: "grid",
          gap: 18
        }}
      >
        <h2>
          {edit ? "Edit Site" : "New Site"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 15
          }}
        >
          {field("code", "Site Code")}
          {field("customerName", "Customer Name")}
          {field("name", "Site Name")}
          {field("city", "City")}
          {field("state", "State")}
          {field("address", "Full Address")}

          <label>
            Distance from Company (km)
            <input
              type="number"
              min="0"
              step="0.1"
              style={inputStyle}
              value={form.distanceKm}
              onChange={e =>
                update(
                  "distanceKm",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            Reporting Time
            <input
              type="time"
              required
              style={inputStyle}
              value={form.reportingTime}
              onChange={e =>
                update(
                  "reportingTime",
                  e.target.value
                )
              }
            />
          </label>

          <label>
            TA Policy
            <select
              style={inputStyle}
              value={form.taPolicy}
              onChange={e =>
                update(
                  "taPolicy",
                  e.target.value
                )
              }
            >
              {[
                "NONE",
                "FIXED",
                "ACTUAL",
                "BOTH"
              ].map(x => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fixed Daily TA (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              disabled={
                !["FIXED", "BOTH"].includes(
                  form.taPolicy
                )
              }
              value={form.fixedDailyTA}
              onChange={e =>
                update(
                  "fixedDailyTA",
                  e.target.value
                )
              }
            />
          </label>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center"
            }}
          >
            <input
              type="checkbox"
              checked={form.active}
              onChange={e =>
                update(
                  "active",
                  e.target.checked
                )
              }
            />
            Active Site
          </label>
        </div>

        {/* ======================================
            LOCATION PICKER
        ====================================== */}

        <section
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: 18,
            display: "grid",
            gap: 14
          }}
        >
          <h3 style={{ margin: 0 }}>
            Select Site GPS Location
          </h3>

          <p
            style={{
              margin: 0,
              color: "#64748b"
            }}
          >
            Search for the office or customer
            location, click the map or drag
            the pin to the approved attendance
            area. GPS coordinates will fill
            automatically.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            <input
              style={{
                ...inputStyle,
                flex: "1 1 250px",
                width: "auto"
              }}
              placeholder="Search location, company, landmark..."
              value={searchText}
              onChange={e =>
                setSearchText(e.target.value)
              }
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!searching) searchLocation();
                }
              }}
            />

            <button
              type="button"
              style={btnStyle}
              disabled={searching}
              onClick={searchLocation}
            >
              {searching
                ? "Searching..."
                : "Search Map"}
            </button>

            <button
              type="button"
              style={btnStyle}
              disabled={locating}
              onClick={useCurrentLocation}
            >
              {locating
                ? "Getting GPS..."
                : "Use Current Location"}
            </button>
          </div>

          {/* SEARCH RESULTS */}

          {searchResults.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 6
              }}
            >
              {searchResults.map(result => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() =>
                    selectSearchResult(result)
                  }
                  style={{
                    ...btnStyle,
                    textAlign: "left",
                    background: "#f8fafc"
                  }}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {/* INTERACTIVE MAP */}

          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: 380,
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #cbd5e1",
              zIndex: 0
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",
              gap: 12
            }}
          >
            <label>
              GPS Latitude
              <input
                style={{
                  ...inputStyle,
                  background: "#f1f5f9"
                }}
                readOnly
                value={
                  latitude == null
                    ? ""
                    : latitude
                }
                placeholder="Select on map"
              />
            </label>

            <label>
              GPS Longitude
              <input
                style={{
                  ...inputStyle,
                  background: "#f1f5f9"
                }}
                readOnly
                value={
                  longitude == null
                    ? ""
                    : longitude
                }
                placeholder="Select on map"
              />
            </label>

            <label>
              Allowed GPS Radius (metres)
              <input
                type="number"
                min="50"
                max="10000"
                step="1"
                style={inputStyle}
                value={form.gps.radiusMeters}
                onChange={e =>
                  updateGps(
                    "radiusMeters",
                    e.target.value
                  )
                }
              />
            </label>
          </div>

          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background:
                validCoordinates(
                  latitude,
                  longitude
                )
                  ? "#f0fdf4"
                  : "#fff7ed",
              color:
                validCoordinates(
                  latitude,
                  longitude
                )
                  ? "#166534"
                  : "#9a3412"
            }}
          >
            {validCoordinates(
              latitude,
              longitude
            )
              ? "GPS location selected. Confirm the marker and radius before saving."
              : "GPS location not configured. Select a location on the map."}
          </div>
        </section>

        {/* ======================================
            SAVE / CANCEL
        ====================================== */}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          <button
            className="primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : edit
              ? "Update Site"
              : "Create Site"}
          </button>

          {edit && (
            <button
              type="button"
              className="outline"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ==========================================
          SAVED SITES
      ========================================== */}

      <div
        className="card"
        style={{
          padding: 20,
          overflowX: "auto"
        }}
      >
        <h2>
          Saved Sites ({rows.length})
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >
          <thead>
            <tr>
              {[
                "Code",
                "Customer",
                "Site",
                "City",
                "Reporting",
                "TA Policy",
                "GPS",
                "Status",
                "Action"
              ].map(label => (
                <th
                  key={label}
                  style={{
                    padding: 10,
                    textAlign: "left"
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map(row => {
              const gpsReady =
                validCoordinates(
                  row.gps?.latitude,
                  row.gps?.longitude
                );

              return (
                <tr key={row._id}>
                  {[
                    row.code,
                    row.customerName,
                    row.name,
                    row.city,
                    row.reportingTime,
                    row.taPolicy,
                    gpsReady
                      ? "Configured"
                      : "Not Configured",
                    row.active
                      ? "Active"
                      : "Inactive"
                  ].map((value, index) => (
                    <td
                      key={index}
                      style={{
                        padding: 10,
                        borderTop:
                          "1px solid #e2e8f0"
                      }}
                    >
                      {value}
                    </td>
                  ))}

                  <td
                    style={{
                      padding: 10,
                      borderTop:
                        "1px solid #e2e8f0"
                    }}
                  >
                    <button
                      type="button"
                      className="outline"
                      onClick={() => start(row)}
                    >
                      Edit
                    </button>

                    {" "}

                    {row.active && (
                      <button
                        type="button"
                        className="outline"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Deactivate this site? Historical records are retained."
                            )
                          ) {
                            return;
                          }

                          try {
                            await api.delete(
                              `/sites/${row._id}`
                            );

                            await load();
                          } catch (e) {
                            setError(errorText(e));
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
