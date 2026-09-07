import { destinations } from './destinations.mjs';
import { emptyPlan, storageKey, escapeHTML as esc, setDates, validatePlan, overlaps, prettyDate, planText, withSuggestions } from './planner-core.mjs';
const cityId = document.body.dataset.destination;
const city = destinations[cityId];
const $ = id => document.getElementById(id);
const counted = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
let plan = emptyPlan(), selectedDay = 0, filter = 'All', query = '', storageIssue = '';
try {
  const raw = localStorage.getItem(storageKey(cityId));
  if (raw) plan = validatePlan(JSON.parse(raw), city);
} catch { storageIssue = 'A saved plan could not be loaded. You can start a new plan and download a copy.'; }
const announce = message => { $('status').textContent = message; };
const external = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
const mapLink = name => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name + ', ' + (cityId === 'dominican' ? 'Punta Cana, Dominican Republic' : city.name));
function persist() {
  try { localStorage.setItem(storageKey(cityId), JSON.stringify(plan)); $('save-state').textContent = 'Saved in this browser'; }
  catch { $('save-state').textContent = 'Browser saving unavailable. Download your plan to keep it.'; }
}
function hotelInfo() {
  const hotel = city.hotels.find(h => h.id === plan.hotel);
  $('hotel-info').innerHTML = hotel ? `${esc(hotel.area)} · ${external(hotel.url, 'Hotel website')} · ${external(mapLink(hotel.name), 'Map')}` : 'Optional. Compare the hotel websites, then choose a base.';
}
function renderDays() {
  $('day-select').innerHTML = plan.days.length ? plan.days.map((day, i) => `<option value="${i}">Day ${i + 1} · ${esc(prettyDate(day.date))}</option>`).join('') : '<option value="">Choose your dates first</option>';
  $('day-select').value = plan.days.length ? String(selectedDay) : '';
  $('day-select').disabled = !plan.days.length;
  $('custom-submit').disabled = !plan.days.length;
  $('use-suggestions').disabled = !plan.days.length;
  $('print').disabled = $('download').disabled = $('backup').disabled = !plan.days.length;
  $('day-tabs').innerHTML = plan.days.map((day, i) => `<button type="button" data-day="${i}" aria-pressed="${i === selectedDay}"><span>Day ${i + 1}</span><small>${esc(prettyDate(day.date).split(',')[0])} · ${counted(day.items.length, 'stop')}</small></button>`).join('');
  $('plan-heading').textContent = plan.days.length ? `Day ${selectedDay + 1}` : 'Your itinerary starts here';
  $('plan-date').textContent = plan.days.length ? prettyDate(plan.days[selectedDay].date) : 'Choose dates, then add the places you want to visit.';
  const day = plan.days[selectedDay];
  const conflicts = overlaps(day?.items || []);
  $('day-total').textContent = day ? `${counted(day.items.length, 'stop')} · ${day.items.reduce((n, item) => n + item.minutes, 0)} minutes planned, plus travel` : '';
  $('stops').innerHTML = day?.items.length ? day.items.map((item, i) => {
    const place = city.places.find(p => p.id === item.placeId);
    const late = item.time && Number(item.time.slice(0,2)) * 60 + Number(item.time.slice(3)) + item.minutes > 1440;
    return `<li class="stop"><div class="stop-head"><span class="stop-number">${i + 1}</span><div><h3>${esc(item.name)}</h3>${place ? `<p class="muted">${esc(place.area)} · ${external(place.url, 'Official website')} · ${external(mapLink(place.name), 'Map')}</p>` : '<p class="muted">Your own stop</p>'}</div></div>
      <div class="stop-fields"><label>Local time<input type="time" value="${esc(item.time)}" data-index="${i}" data-field="time"></label><label>Minutes<input type="number" min="15" max="720" step="1" value="${item.minutes}" data-index="${i}" data-field="minutes"></label><label>Move to day<select data-index="${i}" data-field="day">${plan.days.map((d, n) => `<option value="${n}" ${n === selectedDay ? 'selected' : ''}>Day ${n + 1}</option>`).join('')}</select></label></div>
      <label class="notes-label">Notes<textarea maxlength="1500" rows="2" data-index="${i}" data-field="notes" placeholder="Tickets to book, meal ideas, or a meeting point">${esc(item.notes)}</textarea></label>
      ${conflicts.has(i) ? '<p class="warning">This time overlaps another stop.</p>' : ''}${late ? '<p class="warning">This stop extends past midnight.</p>' : ''}
      <div class="stop-actions"><button type="button" data-action="up" data-index="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(item.name)} earlier in the list">↑ Earlier</button><button type="button" data-action="down" data-index="${i}" ${i === day.items.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(item.name)} later in the list">↓ Later</button><button type="button" data-action="remove" data-index="${i}" aria-label="Remove ${esc(item.name)}">Remove</button></div></li>`;
  }).join('') : '<li class="empty"><span class="empty-mark" aria-hidden="true">+</span><h3>Leave room for what you love.</h3><p>Pick a place from the guide or add your own stop. Nothing is booked when you add it here.</p></li>';
  $('print-plan').textContent = planText(plan, city);
  $('trip-summary').textContent = plan.days.length ? `${counted(plan.days.length, 'day')} · ${counted(plan.days.reduce((n, d) => n + d.items.length, 0), 'stop')}` : 'Your dates. Your pace.';
}
function renderPlaces() {
  const matches = city.places.filter(p => (filter === 'All' || p.kind === filter) && `${p.name} ${p.area} ${p.detail}`.toLowerCase().includes(query.toLowerCase()));
  $('result-count').textContent = `${matches.length} places`;
  $('places').innerHTML = matches.length ? matches.map(p => {
    const kind = ({ Food: 'restaurant', Outdoors: 'outdoors', Adventure: 'tour', Music: 'tour', Theatre: 'tour' })[p.kind] || 'attraction';
    const chosen = plan.days[selectedDay]?.items.some(item => item.placeId === p.id);
    return `<article class="place-card kind-${kind}${chosen ? ' is-selected' : ''}"><div class="place-card-body"><div class="place-meta"><span>${esc(p.kind)}${chosen ? ' · In this day' : ''}</span><span>${esc(p.area)}</span></div><div class="place-title-row"><h3>${esc(p.name)}</h3></div><p>${esc(p.detail)}</p><div class="place-facts"><span>${p.minutes} min allowance</span></div><div class="place-actions">${external(p.url, 'Official website')} ${external(mapLink(p.name), 'Map')}<button type="button" class="choose-button add-place" data-add="${p.id}" ${!plan.days.length ? 'disabled' : ''}>+ ${chosen ? 'Add again to' : 'Add to'} day ${selectedDay + 1}</button></div></div></article>`;
  }).join('') : '<p class="empty">No matches. Try another area or add your own stop.</p>';
}
function redraw() { renderDays(); renderPlaces(); hotelInfo(); }
$('suggestion-days').innerHTML = city.suggestions.map((day, i) => `<li><strong>Day ${i + 1} · ${esc(day.name)}</strong><span>${day.places.map(id => esc(city.places.find(p => p.id === id).name)).join(' → ')}</span></li>`).join('');
$('use-suggestions').addEventListener('click', () => {
  try {
    const result = withSuggestions(plan, city); plan = result.plan; persist(); redraw();
    announce(result.added ? `Suggestions added to ${counted(result.added, 'empty day')}. Choose times after checking opening hours and travel.` : 'Your first three days already have stops. Clear a day to use its suggestions.');
  } catch (error) { announce(error.message); }
});
$('hotel').innerHTML = '<option value="">Choose a hotel (optional)</option>' + city.hotels.map(h => `<option value="${h.id}">${esc(h.name)} · ${esc(h.area)}</option>`).join('');
$('hotel').value = plan.hotel;
$('start').value = plan.start;
$('end').value = plan.end;
$('filters').innerHTML = ['All', ...new Set(city.places.map(p => p.kind))].map(kind => `<button type="button" data-filter="${kind}" aria-pressed="${kind === 'All'}">${kind}</button>`).join('');
$('trip-form').addEventListener('submit', event => {
  event.preventDefault();
  try { plan = setDates(plan, $('start').value, $('end').value); selectedDay = Math.min(selectedDay, plan.days.length - 1); persist(); redraw(); announce('Dates updated. Existing stops stay with their day number.'); }
  catch (error) { announce(error.message); }
});
$('hotel').addEventListener('change', () => { plan.hotel = $('hotel').value; persist(); hotelInfo(); $('print-plan').textContent = planText(plan, city); announce('Hotel option saved. No reservation has been made.'); });
$('day-select').addEventListener('change', () => { selectedDay = Number($('day-select').value); redraw(); });
$('day-tabs').addEventListener('click', event => { const button = event.target.closest('[data-day]'); if (button) { selectedDay = Number(button.dataset.day); redraw(); } });
$('filters').addEventListener('click', event => { const button = event.target.closest('[data-filter]'); if (button) { filter = button.dataset.filter; for (const b of $('filters').children) b.setAttribute('aria-pressed', String(b === button)); renderPlaces(); } });
$('search').addEventListener('input', () => { query = $('search').value; renderPlaces(); });
function add(item) {
  const day = plan.days[selectedDay];
  if (!day) return announce('Choose your dates first.');
  if (day.items.length >= 30) return announce('This day has 30 stops. Choose another day.');
  day.items.push(item); persist(); redraw(); announce(`${item.name} added to day ${selectedDay + 1}.`);
}
$('places').addEventListener('click', event => { const button = event.target.closest('[data-add]'); if (button) { const p = city.places.find(p => p.id === button.dataset.add); add({ placeId: p.id, name: p.name, time: '', minutes: p.minutes, notes: '' }); } });
$('custom-form').addEventListener('submit', event => { event.preventDefault(); const name = $('custom-name').value.trim(); if (!name) return; add({ placeId: '', name, time: '', minutes: 60, notes: '' }); $('custom-name').value = ''; });
$('stops').addEventListener('input', event => {
  const el = event.target;
  if (el.dataset.field !== 'notes') return;
  plan.days[selectedDay].items[Number(el.dataset.index)].notes = el.value;
  persist(); $('print-plan').textContent = planText(plan, city);
});
$('stops').addEventListener('change', event => {
  const el = event.target, i = Number(el.dataset.index), field = el.dataset.field;
  if (!field) return;
  const item = plan.days[selectedDay].items[i];
  if (field === 'day') {
    const target = plan.days[Number(el.value)];
    if (target.items.length >= 30) { redraw(); return announce('That day already has 30 stops.'); }
    plan.days[selectedDay].items.splice(i, 1); target.items.push(item);
  } else if (field === 'minutes') {
    if (!el.checkValidity() || !Number.isInteger(Number(el.value)) || !el.value) { announce('Enter a duration from 15 to 720 minutes.'); el.value = item.minutes; return; }
    item.minutes = Number(el.value);
  } else item[field] = el.value;
  persist();
  if (field === 'notes') { $('print-plan').textContent = planText(plan, city); return; }
  renderDays(); renderPlaces(); announce('Stop updated.');
});
$('stops').addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const i = Number(button.dataset.index), items = plan.days[selectedDay].items, action = button.dataset.action;
  if (action === 'remove') items.splice(i, 1);
  else { const j = i + (action === 'up' ? -1 : 1); [items[i], items[j]] = [items[j], items[i]]; }
  persist(); renderDays(); renderPlaces(); announce(action === 'remove' ? 'Stop removed.' : 'Stop order updated.');
  $('plan-heading').focus();
});
function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('download').addEventListener('click', () => download(planText(plan, city), `${cityId}-itinerary.txt`, 'text/plain;charset=utf-8'));
$('backup').addEventListener('click', () => download(JSON.stringify({ destination: cityId, plan }, null, 2), `${cityId}-itinerary.json`, 'application/json'));
$('print').addEventListener('click', () => { $('print-plan').textContent = planText(plan, city); window.print(); });
$('restore').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2000000) throw Error('Choose a planner backup smaller than 2 MB.');
    const backup = JSON.parse(await file.text());
    if (backup.destination !== cityId) throw Error('Open the matching destination to restore this file.');
    const restored = validatePlan(backup.plan, city);
    if (plan.days.length && !window.confirm('Replace this browser’s current plan with this backup?')) return;
    plan = restored; selectedDay = 0; $('start').value = plan.start; $('end').value = plan.end; $('hotel').value = plan.hotel; persist(); redraw(); announce('Plan restored in this browser.');
  } catch (error) { announce(error instanceof SyntaxError ? 'This file is not a valid planner backup.' : error.message); }
  finally { event.target.value = ''; }
});
$('reset').addEventListener('click', () => {
  if (!window.confirm('Clear the dates, hotel choice, and stops for this destination in this browser?')) return;
  plan = emptyPlan(); selectedDay = 0; $('start').value = ''; $('end').value = ''; $('hotel').value = ''; persist(); redraw(); announce('This destination’s plan has been cleared.');
});
redraw();
$('save-state').textContent = 'Plans stay in this browser. Download a copy to keep.';
if (storageIssue) announce(storageIssue);
