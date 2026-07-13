async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.errors?.join('; ') || body.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export function fetchMeta() {
  return request('/api/meta');
}

export function fetchBathrooms(filters = {}, location = null) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.minRating) params.set('minRating', filters.minRating);
  if (filters.access?.length) params.set('access', filters.access.join(','));
  if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
  if (filters.sort) params.set('sort', filters.sort);
  if (location) {
    params.set('lat', location.lat);
    params.set('lng', location.lng);
  }
  const qs = params.toString();
  return request(`/api/bathrooms${qs ? `?${qs}` : ''}`);
}

export function fetchBathroom(id) {
  return request(`/api/bathrooms/${id}`);
}

export function createBathroom(data) {
  return request('/api/bathrooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function createReview(bathroomId, data) {
  return request(`/api/bathrooms/${bathroomId}/reviews`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Opens the platform's maps app with driving/walking directions to the point. */
export function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
