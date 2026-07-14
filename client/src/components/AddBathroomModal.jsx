import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { createBathroom } from '../api.js';
import { StarInput } from './StarRating.jsx';
import { AmenityIcon } from '../icons.jsx';

export default function AddBathroomModal({ meta, location, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('public');
  const [amenities, setAmenities] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleAmenity = (key) =>
    setAmenities((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name,
        address,
        description,
        lat: location.lat,
        lng: location.lng,
        access,
        amenities,
      };
      if (rating > 0) payload.initialReview = { rating, comment };
      const created = await createBathroom(payload);
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add a bathroom</h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="muted modal-location">
          <MapPin size={14} /> Location: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
        <form onSubmit={submit} className="add-form">
          <label>
            Name *
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Library 2nd Floor Restroom"
              required
              maxLength={120}
            />
          </label>
          <label>
            Address
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address (optional)"
              maxLength={200}
            />
          </label>
          <label>
            Notes
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How to find it, door codes, hours…"
              rows={2}
              maxLength={1000}
            />
          </label>
          <fieldset className="fieldset">
            <legend>Access</legend>
            <div className="access-options">
              {meta.accessTypes.map((a) => (
                <label key={a.key} className={`access-option ${access === a.key ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="access"
                    value={a.key}
                    checked={access === a.key}
                    onChange={() => setAccess(a.key)}
                  />
                  <span>
                    <strong>{a.label}</strong>
                    <small>{a.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="fieldset">
            <legend>Amenities</legend>
            <div className="filter-chips">
              {meta.amenities.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`chip ${amenities.includes(a.key) ? 'active' : ''}`}
                  onClick={() => toggleAmenity(a.key)}
                >
                  <AmenityIcon amenity={a.key} size={15} /> {a.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="fieldset">
            <legend>Your rating (optional)</legend>
            <StarInput value={rating} onChange={setRating} />
            {rating > 0 && (
              <textarea
                className="input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Quick review…"
                rows={2}
                maxLength={1000}
              />
            )}
          </fieldset>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add bathroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
