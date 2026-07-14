import { Star } from 'lucide-react';

const SIZES = { sm: 14, md: 18 };

function StarRow({ px, filled }) {
  return (
    <span className="stars-row">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={px}
          fill={filled ? 'currentColor' : 'none'}
          strokeWidth={filled ? 0 : 1.75}
        />
      ))}
    </span>
  );
}

export function Stars({ rating, size = 'md' }) {
  if (rating == null) {
    return <span className="stars-none">No ratings yet</span>;
  }
  const px = SIZES[size] ?? SIZES.md;
  return (
    <span className={`stars stars-${size}`} title={`${rating} out of 5`}>
      <span className="stars-track" aria-hidden="true" style={{ height: px }}>
        <span className="stars-fill" style={{ width: `${(rating / 5) * 100}%` }}>
          <StarRow px={px} filled />
        </span>
        <StarRow px={px} filled={false} />
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
          <Star size={26} fill={value >= n ? 'currentColor' : 'none'} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
