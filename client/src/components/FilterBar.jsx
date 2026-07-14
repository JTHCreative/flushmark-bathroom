import { LocateFixed, X } from 'lucide-react';
import { AmenityIcon } from '../icons.jsx';

export default function FilterBar({ meta, filters, onChange, userLocation, onLocate, locating }) {
  const toggle = (key, value) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const activeCount =
    filters.access.length + filters.amenities.length + (filters.minRating ? 1 : 0);

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search by name, address…"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
        />
        <button
          type="button"
          className={`btn btn-locate ${userLocation ? 'active' : ''}`}
          onClick={onLocate}
          disabled={locating}
          title="Sort by distance from your location"
        >
          <LocateFixed size={16} /> {locating ? 'Locating…' : 'Near me'}
        </button>
        <select
          className="select"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          aria-label="Sort by"
        >
          <option value="rating">Top rated</option>
          <option value="reviews">Most reviewed</option>
          <option value="newest">Newest</option>
          {userLocation && <option value="distance">Nearest</option>}
        </select>
        <select
          className="select"
          value={filters.minRating}
          onChange={(e) => onChange({ ...filters, minRating: e.target.value })}
          aria-label="Minimum rating"
        >
          <option value="">Any rating</option>
          <option value="3">3★ & up</option>
          <option value="4">4★ & up</option>
          <option value="4.5">4.5★ & up</option>
        </select>
      </div>
      <div className="filter-row filter-chips">
        {meta.accessTypes.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`chip chip-access ${filters.access.includes(a.key) ? 'active' : ''}`}
            onClick={() => toggle('access', a.key)}
            title={a.description}
          >
            {a.label}
          </button>
        ))}
        <span className="chip-divider" aria-hidden="true" />
        {meta.amenities.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`chip ${filters.amenities.includes(a.key) ? 'active' : ''}`}
            onClick={() => toggle('amenities', a.key)}
          >
            <AmenityIcon amenity={a.key} size={15} /> {a.label}
          </button>
        ))}
        {activeCount > 0 && (
          <button
            type="button"
            className="chip chip-clear"
            onClick={() =>
              onChange({ ...filters, access: [], amenities: [], minRating: '' })
            }
          >
            <X size={14} /> Clear filters ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
