export const ACCESS_TYPES = [
  { key: 'public', label: 'Public', description: 'Free and open to everyone' },
  { key: 'customers_only', label: 'Customers only', description: 'Requires a purchase or receipt code' },
  { key: 'private', label: 'Private', description: 'Ask staff for a key or permission' },
];

export const AMENITIES = [
  { key: 'shower', label: 'Shower' },
  { key: 'baby_changing', label: 'Baby changing table' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
  { key: 'gender_neutral', label: 'Gender neutral' },
  { key: 'menstrual_products', label: 'Menstrual products' },
  { key: 'soap', label: 'Soap' },
  { key: 'paper_towels', label: 'Paper towels' },
  { key: 'hand_dryer', label: 'Hand dryer' },
  { key: 'toiletries', label: 'Free toiletries' },
];

export const ACCESS_KEYS = ACCESS_TYPES.map((a) => a.key);
export const AMENITY_KEYS = AMENITIES.map((a) => a.key);
