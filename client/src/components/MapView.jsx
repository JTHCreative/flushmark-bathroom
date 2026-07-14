import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { Stars } from './StarRating.jsx';
import { directionsUrl } from '../api.js';
import { formatDistance } from './ListView.jsx';

const DEFAULT_CENTER = [37.7793, -122.4193]; // San Francisco
const DEFAULT_ZOOM = 13;

// CARTO basemaps: clean, Google-Maps-like cartography on OSM data, no API key.
// Voyager for light mode; a true dark basemap for dark mode.
const TILES = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const STAR_SVG =
  '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">' +
  '<path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>' +
  '</svg>';

function ratingClass(rating) {
  if (rating == null) return 'pin-unrated';
  if (rating >= 4) return 'pin-great';
  if (rating >= 3) return 'pin-ok';
  return 'pin-poor';
}

function pinIcon(bathroom, selected) {
  const label = bathroom.avg_rating != null ? bathroom.avg_rating.toFixed(1) : '–';
  return L.divIcon({
    className: '',
    html: `<div class="pin ${ratingClass(bathroom.avg_rating)} ${selected ? 'pin-selected' : ''}">
             ${STAR_SVG}<span class="pin-rating">${label}</span>
           </div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 44],
    popupAnchor: [0, -40],
  });
}

function FlyToSelection({ bathrooms, selectedId }) {
  const map = useMap();
  useEffect(() => {
    const b = bathrooms.find((x) => x.id === selectedId);
    if (b) map.flyTo([b.lat, b.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ClickToPlace({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapView({
  bathrooms,
  selectedId,
  onSelect,
  userLocation,
  addMode,
  onPickLocation,
  theme = 'light',
}) {
  const tiles = TILES[theme] ?? TILES.light;
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className={`map ${addMode ? 'map-adding' : ''}`}
      scrollWheelZoom
    >
      <TileLayer key={theme} attribution={tiles.attribution} url={tiles.url} />
      <FlyToSelection bathrooms={bathrooms} selectedId={selectedId} />
      <ClickToPlace enabled={addMode} onPick={onPickLocation} />
      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={80}
          pathOptions={{ color: '#8a8471', fillColor: '#8a8471', fillOpacity: 0.35 }}
        />
      )}
      {bathrooms.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={pinIcon(b, b.id === selectedId)}
          eventHandlers={{ click: () => onSelect(b.id) }}
        >
          <Popup>
            <div className="popup">
              <strong>{b.name}</strong>
              <div className="popup-rating">
                <Stars rating={b.avg_rating} size="sm" />
                <span>({b.review_count})</span>
              </div>
              {b.distance_km != null && <div>{formatDistance(b.distance_km)} away</div>}
              <div className="popup-actions">
                <a href={directionsUrl(b.lat, b.lng)} target="_blank" rel="noreferrer">
                  <Navigation size={12} /> Directions
                </a>
                <button type="button" onClick={() => onSelect(b.id)}>
                  Details
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
