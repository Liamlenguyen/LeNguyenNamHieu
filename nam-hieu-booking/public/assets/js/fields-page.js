/**
 * fields-page.js — Field list page controller
 * Wires filter controls → api.listFields() → renders field cards grid.
 * Handles empty state and loading skeleton.
 */

import { api } from './api.js';
import { formatVnd } from './format-vn.js';

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {{ district: string, priceRange: string[], capacity: number|null, sort: string }} */
const _state = {
  district: '',
  priceRange: [],
  capacity: null,
  sort: '',
};

// ─── DOM refs ────────────────────────────────────────────────────────────────

const grid = document.getElementById('fields-grid');
const emptyState = document.getElementById('fields-empty');
const loadingState = document.getElementById('fields-loading');
const districtSelect = document.getElementById('filter-district');
const capacityBtns = document.querySelectorAll('[data-capacity]');
const priceCheckboxes = document.querySelectorAll('[data-price-range]');
const sortSelect = document.getElementById('filter-sort');

// ─── Render helpers ───────────────────────────────────────────────────────────

/** @param {import('./mock-api.js').Field} field */
function _buildFieldCard(field) {
  const capacityLabel =
    field.capacity === 5 ? '⚽ Sân 5 người'
    : field.capacity === 7 ? '⚽ Sân 7 người'
    : '⚽ Sân 11 người';

  const card = document.createElement('article');
  card.className = 'card group';

  const priceFormatted = formatVnd(field.price_per_hour_vnd);

  // Use textContent for user-supplied data to prevent XSS
  const img = document.createElement('img');
  img.src = field.image_url;
  img.alt = field.name;
  img.className = 'card-image transition-transform duration-300 group-hover:scale-105';
  img.loading = 'lazy';
  img.onerror = function () {
    this.src = '/assets/images/san-bong.jpg';
  };

  const body = document.createElement('div');
  body.className = 'card-body';

  const meta = document.createElement('div');
  meta.className = 'flex items-center justify-between mb-2';

  const badge = document.createElement('span');
  badge.className = 'text-xs bg-pitch-100 text-pitch-700 px-2 py-0.5 rounded-full font-medium';
  badge.textContent = capacityLabel;

  const districtBadge = document.createElement('span');
  districtBadge.className = 'text-xs text-slate-400';
  districtBadge.textContent = field.district;

  meta.appendChild(badge);
  meta.appendChild(districtBadge);

  const name = document.createElement('h3');
  name.className = 'font-bold text-slate-900 text-sm mt-1';
  name.textContent = field.name;

  const location = document.createElement('p');
  location.className = 'text-xs text-slate-400 mt-1';
  location.textContent = `${field.surface} · ${field.location}`;

  const footer = document.createElement('div');
  footer.className = 'mt-3 flex items-center justify-between';

  const price = document.createElement('span');
  price.className = 'text-pitch-600 font-bold text-sm';
  price.innerHTML = `từ ${priceFormatted}<span class="text-xs font-normal text-slate-400">/giờ</span>`;

  const btn = document.createElement('a');
  btn.href = `/field.html?id=${encodeURIComponent(field.id)}`;
  btn.className = 'btn-primary text-xs px-3 py-1.5';
  btn.textContent = 'Xem chi tiết & đặt sân';
  btn.setAttribute('aria-label', `Xem chi tiết và đặt sân ${field.name}`);

  footer.appendChild(price);
  footer.appendChild(btn);

  body.appendChild(meta);
  body.appendChild(name);
  body.appendChild(location);
  body.appendChild(footer);

  const imgWrapper = document.createElement('div');
  imgWrapper.className = 'overflow-hidden';
  imgWrapper.appendChild(img);

  card.appendChild(imgWrapper);
  card.appendChild(body);

  return card;
}

function _renderSkeletons(count = 6) {
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'card animate-pulse';
    sk.innerHTML = `
      <div class="w-full h-44 bg-slate-200"></div>
      <div class="card-body space-y-2">
        <div class="h-3 bg-slate-200 rounded w-1/3"></div>
        <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        <div class="h-8 bg-slate-200 rounded mt-3 w-full"></div>
      </div>`;
    grid.appendChild(sk);
  }
}

// ─── Core fetch + render ──────────────────────────────────────────────────────

async function _fetchAndRender() {
  if (!grid) return;

  _renderSkeletons();
  if (emptyState) emptyState.classList.add('hidden');

  // Build price filter from checkboxes
  const priceRanges = _state.priceRange;
  let priceMin, priceMax;
  if (priceRanges.length > 0) {
    const mins = [];
    const maxs = [];
    priceRanges.forEach((r) => {
      if (r === 'lt200') { mins.push(0); maxs.push(200000); }
      else if (r === '200to400') { mins.push(200000); maxs.push(400000); }
      else if (r === 'gt400') { mins.push(400000); maxs.push(Infinity); }
    });
    priceMin = Math.min(...mins);
    const rawMax = Math.max(...maxs);
    priceMax = rawMax === Infinity ? undefined : rawMax;
  }

  try {
    const fields = await api.listFields({
      district: _state.district || undefined,
      priceMin,
      priceMax,
      capacity: _state.capacity || undefined,
      sort: _state.sort || undefined,
    });

    grid.innerHTML = '';

    if (fields.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    fields.forEach((f) => grid.appendChild(_buildFieldCard(f)));
  } catch (err) {
    grid.innerHTML = '';
    const errDiv = document.createElement('div');
    errDiv.className = 'col-span-full text-center py-12 text-slate-500';
    errDiv.textContent = 'Có lỗi khi tải danh sách sân. Vui lòng thử lại.';
    grid.appendChild(errDiv);
    console.error('[fields-page] listFields error:', err);
  }
}

// ─── Filter population ────────────────────────────────────────────────────────

function _populateDistrictFilter() {
  if (!districtSelect) return;
  const districts = api.getDistricts();
  districts.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    districtSelect.appendChild(opt);
  });
}

// ─── Event wiring ────────────────────────────────────────────────────────────

function _wireFilters() {
  if (districtSelect) {
    districtSelect.addEventListener('change', () => {
      _state.district = districtSelect.value;
      _fetchAndRender();
    });
  }

  capacityBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.capacity ? Number(btn.dataset.capacity) : null;
      _state.capacity = _state.capacity === val ? null : val;

      // Toggle active state styling
      capacityBtns.forEach((b) => {
        b.classList.toggle(
          'bg-pitch-600',
          b.dataset.capacity === String(_state.capacity)
        );
        b.classList.toggle(
          'text-white',
          b.dataset.capacity === String(_state.capacity)
        );
        b.classList.toggle(
          'bg-slate-100',
          b.dataset.capacity !== String(_state.capacity)
        );
        b.classList.toggle(
          'text-slate-700',
          b.dataset.capacity !== String(_state.capacity)
        );
      });
      _fetchAndRender();
    });
  });

  priceCheckboxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      const range = cb.dataset.priceRange;
      if (cb.checked) {
        if (!_state.priceRange.includes(range)) _state.priceRange.push(range);
      } else {
        _state.priceRange = _state.priceRange.filter((r) => r !== range);
      }
      _fetchAndRender();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      _state.sort = sortSelect.value;
      _fetchAndRender();
    });
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────

_populateDistrictFilter();
_wireFilters();
_fetchAndRender();
