export const MAX_DAYS = 31;
export const emptyPlan = () => ({ version: 1, start: '', end: '', hotel: '', days: [] });
export const storageKey = city => `public-trip-planner:v1:${city}`;
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export function dateRange(start, end) {
  const parse = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '2199-12-31') throw Error('Choose valid dates between 1900 and 2199.');
    const stamp = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) throw Error('Choose valid calendar dates.');
    return stamp;
  };
  const a = parse(start), b = parse(end), count = (b - a) / 86400000 + 1;
  if (count < 1) throw Error('The last day must be on or after the first day.');
  if (count > MAX_DAYS) throw Error(`Choose a trip of up to ${MAX_DAYS} days.`);
  return Array.from({ length: count }, (_, i) => new Date(a + i * 86400000).toISOString().slice(0, 10));
}
export function setDates(plan, start, end) {
  const dates = dateRange(start, end);
  if (plan.days.slice(dates.length).some(day => day.items.length)) throw Error('Move or remove stops from the later days before shortening the trip.');
  return { ...plan, start, end, days: dates.map((date, i) => ({ date, items: plan.days[i]?.items || [] })) };
}
export function validatePlan(raw, city) {
  if (!raw || raw.version !== 1 || typeof raw.hotel !== 'string' || !Array.isArray(raw.days)) throw Error('This saved plan is not supported.');
  if (raw.hotel && !city.hotels.some(h => h.id === raw.hotel)) throw Error('The saved hotel is not in this destination.');
  const dates = raw.start === '' && raw.end === '' ? [] : dateRange(raw.start, raw.end);
  if (dates.length !== raw.days.length) throw Error('The saved days do not match the dates.');
  const text = (s, limit) => typeof s === 'string' && s.length <= limit;
  const days = raw.days.map((day, i) => {
    if (!day || day.date !== dates[i] || !Array.isArray(day.items) || day.items.length > 30) throw Error('The saved day is invalid.');
    return { date: dates[i], items: day.items.map(item => {
      if (!item || !text(item.name, 120) || !item.name.trim() || !text(item.notes, 1500) || !text(item.placeId, 60) || !text(item.time, 5) || (item.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) || !Number.isInteger(item.minutes) || item.minutes < 15 || item.minutes > 720 || (item.placeId && !city.places.some(p => p.id === item.placeId))) throw Error('A saved stop is invalid.');
      return { name: item.name, notes: item.notes, placeId: item.placeId, time: item.time, minutes: item.minutes };
    }) };
  });
  return { version: 1, start: raw.start, end: raw.end, hotel: raw.hotel, days };
}
export function overlaps(items) {
  const result = new Set();
  const spans = items.map((item, i) => ({ i, start: item.time ? Number(item.time.slice(0, 2)) * 60 + Number(item.time.slice(3)) : null, minutes: item.minutes }));
  for (const a of spans) for (const b of spans) {
    if (a.i < b.i && a.start !== null && b.start !== null && a.start < b.start + b.minutes && b.start < a.start + a.minutes) { result.add(a.i); result.add(b.i); }
  }
  return result;
}
export const prettyDate = date => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
export function planText(plan, city) {
  const hotel = city.hotels.find(h => h.id === plan.hotel);
  return [city.name + ' itinerary', plan.start ? `${plan.start} to ${plan.end}` : 'Dates not selected', hotel ? `Hotel option: ${hotel.name} (${hotel.area})` : 'Hotel not selected', 'Times are local to the destination. Check bookings, opening hours, and travel time.', '', ...plan.days.flatMap((day, i) => [`Day ${i + 1} | ${prettyDate(day.date)}`, ...day.items.map(item => `${item.time || 'Time open'} | ${item.name} | ${item.minutes} min${item.notes ? '\n  ' + item.notes : ''}`), ''])].join('\n');
}

export function withSuggestions(plan, city) {
  if (!plan.days.length) throw Error('Choose your dates before adding the suggested itinerary.');
  const next = structuredClone(plan);
  let added = 0;
  city.suggestions.forEach((suggestion, i) => {
    const day = next.days[i];
    if (!day || day.items.length) return;
    day.items = suggestion.places.map(id => {
      const place = city.places.find(p => p.id === id);
      if (!place) throw Error('A suggested place is unavailable.');
      return { placeId: place.id, name: place.name, time: '', minutes: place.minutes, notes: '' };
    });
    added += 1;
  });
  return { plan: next, added };
}
