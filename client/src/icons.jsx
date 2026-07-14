import {
  Accessibility,
  Baby,
  Droplet,
  Scroll,
  ShowerHead,
  Sparkles,
  SprayCan,
  Users,
  Wind,
} from 'lucide-react';

// Flat category colors — muted, earthy tones that harmonize with the
// EDEEC0 / 433E0E / 7C9082 / A7A284 / D0C88E palette.
export const AMENITY_ICONS = {
  shower: { Icon: ShowerHead, color: '#5e8ca8' },
  baby_changing: { Icon: Baby, color: '#c2a24b' },
  wheelchair_accessible: { Icon: Accessibility, color: '#8a8471' },
  gender_neutral: { Icon: Users, color: '#97839b' },
  menstrual_products: { Icon: Droplet, color: '#a85f4f' },
  soap: { Icon: Sparkles, color: '#b0879b' },
  paper_towels: { Icon: Scroll, color: '#A7A284' },
  hand_dryer: { Icon: Wind, color: '#7f8f9c' },
  toiletries: { Icon: SprayCan, color: '#9a9057' },
};

export function AmenityIcon({ amenity, size = 16, label }) {
  const def = AMENITY_ICONS[amenity];
  if (!def) return null;
  const { Icon, color } = def;
  return (
    <span className="amenity-icon" style={{ color }} title={label}>
      <Icon size={size} strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}
