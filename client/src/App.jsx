import { useCallback, useEffect, useMemo, useState } from 'react';
import { List, Map as MapIcon, MapPin, Moon, Plus, Sun, X } from 'lucide-react';
import { fetchMeta, fetchBathrooms } from './api.js';
import FilterBar from './components/FilterBar.jsx';
import ListView from './components/ListView.jsx';
import MapView from './components/MapView.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import AddBathroomModal from './components/AddBathroomModal.jsx';

const EMPTY_FILTERS = { q: '', minRating: '', access: [], amenities: [], sort: 'rating' };

function initialTheme() {
  const saved = localStorage.getItem('flushmark-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [bathrooms, setBathrooms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [mobileTab, setMobileTab] = useState('map');
  const [addMode, setAddMode] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('flushmark-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchMeta().then(setMeta).catch((err) => setLoadError(err.message));
  }, []);

  const refresh = useCallback(() => {
    fetchBathrooms(filters, userLocation)
      .then((body) => {
        setBathrooms(body.bathrooms);
        setLoadError('');
      })
      .catch((err) => setLoadError(err.message));
  }, [filters, userLocation]);

  useEffect(() => {
    const handle = setTimeout(refresh, filters.q ? 250 : 0);
    return () => clearTimeout(handle);
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  };

  const locate = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFilters((f) => ({ ...f, sort: 'distance' }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        showToast('Could not get your location. Check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const selectedDistance = useMemo(
    () => bathrooms.find((b) => b.id === selectedId)?.distance_km ?? null,
    [bathrooms, selectedId]
  );

  const startAdd = () => {
    setSelectedId(null);
    setAddMode(true);
    setMobileTab('map');
  };

  if (!meta) {
    return (
      <div className="app-loading">
        {loadError ? `Failed to load: ${loadError}` : 'Loading FlushMark…'}
      </div>
    );
  }

  const sidePanel = selectedId ? (
    <DetailPanel
      bathroomId={selectedId}
      meta={meta}
      distanceKm={selectedDistance}
      onClose={() => setSelectedId(null)}
      onDataChanged={refresh}
    />
  ) : (
    <ListView
      bathrooms={bathrooms}
      meta={meta}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <MapPin size={22} strokeWidth={2.25} />
          </span>
          <div>
            <h1>FlushMark</h1>
            <p className="tagline">Find & rate bathrooms near you</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="btn btn-primary" onClick={startAdd}>
            <Plus size={16} /> Add bathroom
          </button>
        </div>
      </header>

      <FilterBar
        meta={meta}
        filters={filters}
        onChange={setFilters}
        userLocation={userLocation}
        onLocate={locate}
        locating={locating}
      />

      {loadError && <div className="form-error app-error">{loadError}</div>}
      {addMode && (
        <div className="add-banner">
          Tap the map where the bathroom is located
          <button type="button" className="btn btn-small" onClick={() => setAddMode(false)}>
            Cancel
          </button>
        </div>
      )}

      <main className={`main mobile-${mobileTab}`}>
        <aside className="sidebar">
          <div className="result-count muted">
            {bathrooms.length} bathroom{bathrooms.length === 1 ? '' : 's'} found
          </div>
          {sidePanel}
        </aside>
        <section className="map-wrap">
          <MapView
            bathrooms={bathrooms}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMobileTab('list');
            }}
            userLocation={userLocation}
            addMode={addMode}
            onPickLocation={(loc) => {
              setPendingLocation(loc);
              setAddMode(false);
            }}
          />
        </section>
      </main>

      <nav className="mobile-tabs">
        <button
          type="button"
          className={mobileTab === 'map' ? 'active' : ''}
          onClick={() => setMobileTab('map')}
        >
          <MapIcon size={16} /> Map
        </button>
        <button
          type="button"
          className={mobileTab === 'list' ? 'active' : ''}
          onClick={() => setMobileTab('list')}
        >
          <List size={16} /> List
        </button>
      </nav>

      {pendingLocation && (
        <AddBathroomModal
          meta={meta}
          location={pendingLocation}
          onClose={() => setPendingLocation(null)}
          onCreated={(created) => {
            setPendingLocation(null);
            refresh();
            setSelectedId(created.id);
            setMobileTab('list');
            showToast('Bathroom added — thanks for contributing!');
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
