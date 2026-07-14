import { MapPinOff, Navigation } from 'lucide-react';
import { Stars } from './StarRating.jsx';
import { AmenityIcon } from '../icons.jsx';
import { directionsUrl } from '../api.js';

export function formatDistance(km) {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function AccessBadge({ access, accessTypes }) {
  const info = accessTypes.find((a) => a.key === access);
  return (
    <span className={`badge badge-${access}`} title={info?.description}>
      {info?.label ?? access}
    </span>
  );
}

export default function ListView({ bathrooms, meta, selectedId, onSelect }) {
  if (bathrooms.length === 0) {
    return (
      <div className="empty-state">
        <MapPinOff size={44} className="empty-icon" aria-hidden="true" />
        <p>No bathrooms match your filters.</p>
        <p className="muted">Try clearing a filter — or add the first one in this area!</p>
      </div>
    );
  }

  const amenityByKey = Object.fromEntries(meta.amenities.map((a) => [a.key, a]));

  return (
    <ul className="bathroom-list">
      {bathrooms.map((b) => (
        <li key={b.id}>
          <div
            className={`bathroom-card ${b.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(b.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(b.id)}
            role="button"
            tabIndex={0}
          >
            <div className="card-top">
              <h3 className="card-name">{b.name}</h3>
              {b.distance_km != null && (
                <span className="card-distance">{formatDistance(b.distance_km)}</span>
              )}
            </div>
            <div className="card-rating">
              <Stars rating={b.avg_rating} size="sm" />
              <span className="muted">
                {b.review_count} review{b.review_count === 1 ? '' : 's'}
              </span>
            </div>
            {b.address && <div className="card-address muted">{b.address}</div>}
            <div className="card-meta">
              <AccessBadge access={b.access} accessTypes={meta.accessTypes} />
              <span className="card-amenities">
                {b.amenities.map((key) => (
                  <AmenityIcon
                    key={key}
                    amenity={key}
                    size={16}
                    label={amenityByKey[key]?.label}
                  />
                ))}
              </span>
            </div>
            <div className="card-actions">
              <a
                className="btn btn-small btn-primary"
                href={directionsUrl(b.lat, b.lng)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Navigation size={13} /> Directions
              </a>
              <button
                type="button"
                className="btn btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(b.id);
                }}
              >
                Details & reviews
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
