export const ACCESS_TYPES = [
  { key: 'public', label: 'Public', description: 'Free and open to everyone' },
  { key: 'customers_only', label: 'Customers only', description: 'Requires a purchase or receipt code' },
  { key: 'private', label: 'Private', description: 'Ask staff for a key or permission' },
];

export const AMENITIES = [
  { key: 'shower', label: 'Shower', icon: '🚿' },
  { key: 'baby_changing', label: 'Baby changing table', icon: '🚼' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible', icon: '♿' },
  { key: 'gender_neutral', label: 'Gender neutral', icon: '🚻' },
  { key: 'menstrual_products', label: 'Menstrual products', icon: '🩸' },
  { key: 'soap', label: 'Soap', icon: '🧼' },
  { key: 'paper_towels', label: 'Paper towels', icon: '🧻' },
  { key: 'hand_dryer', label: 'Hand dryer', icon: '💨' },
  { key: 'toiletries', label: 'Free toiletries', icon: '🧴' },
];

export const ACCESS_KEYS = ACCESS_TYPES.map((a) => a.key);
export const AMENITY_KEYS = AMENITIES.map((a) => a.key);
