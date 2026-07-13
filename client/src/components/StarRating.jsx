export function Stars({ rating, size = 'md' }) {
  if (rating == null) {
    return <span className={`stars stars-${size} stars-empty`}>No ratings yet</span>;
  }
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={`stars stars-${size}`} title={`${rating} out of 5`}>
      <span className="stars-track" aria-hidden="true">
        <span className="stars-fill" style={{ width: `${(rounded / 5) * 100}%` }}>
          ★★★★★
        </span>
        ★★★★★
      </span>
      <span className="stars-value">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={`star-input-btn ${value >= n ? 'active' : ''}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
