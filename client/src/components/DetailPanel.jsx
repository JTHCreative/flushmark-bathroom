import { useEffect, useState } from 'react';
import { fetchBathroom, createReview, directionsUrl } from '../api.js';
import { Stars, StarInput } from './StarRating.jsx';
import { AccessBadge, formatDistance } from './ListView.jsx';

function ReviewForm({ bathroomId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please pick a star rating.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createReview(bathroomId, { rating, author, comment });
      setRating(0);
      setAuthor('');
      setComment('');
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <h4>Leave a review</h4>
      <StarInput value={rating} onChange={setRating} />
      <input
        className="input"
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        maxLength={60}
      />
      <textarea
        className="input"
        placeholder="How was it? Cleanliness, stock, wait time…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
      />
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? 'Posting…' : 'Post review'}
      </button>
    </form>
  );
}

export default function DetailPanel({ bathroomId, meta, distanceKm, onClose, onDataChanged }) {
  const [bathroom, setBathroom] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetchBathroom(bathroomId)
      .then(setBathroom)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    setBathroom(null);
    setError('');
    load();
  }, [bathroomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const amenityByKey = Object.fromEntries(meta.amenities.map((a) => [a.key, a]));

  return (
    <div className="detail-panel">
      <button type="button" className="btn btn-back" onClick={onClose}>
        ← Back to list
      </button>
      {error && <div className="form-error">{error}</div>}
      {!bathroom && !error && <div className="muted detail-loading">Loading…</div>}
      {bathroom && (
        <>
          <h2 className="detail-name">{bathroom.name}</h2>
          <div className="card-rating">
            <Stars rating={bathroom.avg_rating} />
            <span className="muted">
              {bathroom.review_count} review{bathroom.review_count === 1 ? '' : 's'}
            </span>
          </div>
          <div className="detail-meta">
            <AccessBadge access={bathroom.access} accessTypes={meta.accessTypes} />
            {distanceKm != null && <span className="muted">{formatDistance(distanceKm)} away</span>}
          </div>
          {bathroom.address && <p className="muted">{bathroom.address}</p>}
          {bathroom.description && <p className="detail-description">{bathroom.description}</p>}

          <a
            className="btn btn-primary btn-directions"
            href={directionsUrl(bathroom.lat, bathroom.lng)}
            target="_blank"
            rel="noreferrer"
          >
            🧭 Get directions
          </a>

          <h4>Amenities</h4>
          {bathroom.amenities.length === 0 ? (
            <p className="muted">No amenities listed.</p>
          ) : (
            <ul className="amenity-list">
              {bathroom.amenities.map((key) => (
                <li key={key}>
                  <span aria-hidden="true">{amenityByKey[key]?.icon}</span>{' '}
                  {amenityByKey[key]?.label ?? key}
                </li>
              ))}
            </ul>
          )}

          <ReviewForm
            bathroomId={bathroom.id}
            onSubmitted={() => {
              load();
              onDataChanged();
            }}
          />

          <h4>Reviews</h4>
          {bathroom.reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first!</p>
          ) : (
            <ul className="review-list">
              {bathroom.reviews.map((r) => (
                <li key={r.id} className="review">
                  <div className="review-head">
                    <strong>{r.author}</strong>
                    <Stars rating={r.rating} size="sm" />
                  </div>
                  {r.comment && <p>{r.comment}</p>}
                  <div className="muted review-date">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
