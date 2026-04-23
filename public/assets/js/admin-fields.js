/**
 * admin-fields.js — Admin tab: Fields CRUD (Phase 05A).
 *
 * Loaded lazily by admin-page.js when the "Sân" tab is activated.
 * Renders a table of all fields (including inactive) with Edit / Deactivate
 * buttons, and a "+ Thêm sân" modal using <dialog>.
 */

import { api } from './api.js';
import { formatVnd } from './format-vn.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _fields = [];
let _initialized = false;

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const panel       = () => document.getElementById('tab-panel-fields');
const tableBody   = () => document.getElementById('admin-fields-tbody');
const dialog      = () => document.getElementById('admin-field-dialog');
const dialogTitle = () => document.getElementById('admin-field-dialog-title');
const fieldForm   = () => document.getElementById('admin-field-form');

function _dispatchToast(message) {
  document.dispatchEvent(new CustomEvent('nh:toast', { detail: { message } }));
}

// ─── Table render ─────────────────────────────────────────────────────────────

function _renderTable() {
  const tbody = tableBody();
  if (!tbody) return;

  if (_fields.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-slate-400 text-sm">
          Chưa có sân nào. Nhấn "+ Thêm sân" để tạo mới.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = _fields.map((f) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors ${f.is_active ? '' : 'opacity-50'}">
      <td class="px-4 py-3 text-sm font-medium text-slate-800">
        ${f.name}
        ${f.is_active ? '' : '<span class="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Tạm ngưng</span>'}
      </td>
      <td class="px-4 py-3 text-sm text-slate-500">${f.district}</td>
      <td class="px-4 py-3 text-sm text-slate-500">${f.capacity} người</td>
      <td class="px-4 py-3 text-sm text-slate-500">${formatVnd(f.price_per_hour_vnd)}/giờ</td>
      <td class="px-4 py-3 text-sm text-slate-500">${f.surface}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <button type="button"
            class="text-xs px-3 py-1.5 rounded-lg bg-pitch-50 text-pitch-700 hover:bg-pitch-100 font-medium transition-colors"
            data-action="edit" data-field-id="${f.id}">
            Sửa
          </button>
          ${f.is_active ? `
          <button type="button"
            class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
            data-action="deactivate" data-field-id="${f.id}">
            Tạm ngưng
          </button>` : `
          <button type="button"
            class="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
            data-action="activate" data-field-id="${f.id}">
            Kích hoạt
          </button>`}
        </div>
      </td>
    </tr>
  `).join('');

  // Wire row action buttons
  tbody.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { action, fieldId } = btn.dataset;
      if (action === 'edit')       _openEditDialog(fieldId);
      if (action === 'deactivate') _handleDeactivate(fieldId, false);
      if (action === 'activate')   _handleDeactivate(fieldId, true);
    });
  });
}

// ─── Modal (create / edit) ────────────────────────────────────────────────────

/**
 * Opens the <dialog> for creating a new field.
 */
function _openCreateDialog() {
  const dlg = dialog();
  if (!dlg) return;

  if (dialogTitle()) dialogTitle().textContent = 'Thêm sân mới';
  _populateForm(null);
  dlg.showModal();
}

/**
 * Opens the <dialog> pre-filled for editing an existing field.
 * @param {string} fieldId
 */
function _openEditDialog(fieldId) {
  const field = _fields.find((f) => f.id === fieldId);
  if (!field) return;

  const dlg = dialog();
  if (!dlg) return;

  if (dialogTitle()) dialogTitle().textContent = `Sửa: ${field.name}`;
  _populateForm(field);
  dlg.showModal();
}

/** @param {import('./mock-api.js').Field|null} field */
function _populateForm(field) {
  const form = fieldForm();
  if (!form) return;

  form.querySelector('[name="id"]').value            = field?.id ?? '';
  form.querySelector('[name="name"]').value          = field?.name ?? '';
  form.querySelector('[name="location"]').value      = field?.location ?? '';
  form.querySelector('[name="district"]').value      = field?.district ?? '';
  form.querySelector('[name="city"]').value          = field?.city ?? 'TP. Hồ Chí Minh';
  form.querySelector('[name="capacity"]').value      = field?.capacity ?? 5;
  form.querySelector('[name="price"]').value         = field?.price_per_hour_vnd ?? 150000;
  form.querySelector('[name="surface"]').value       = field?.surface ?? 'Cỏ nhân tạo';
  form.querySelector('[name="description"]').value   = field?.description ?? '';
  form.querySelector('[name="image_url"]').value     = field?.image_url ?? '';
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function _handleFormSubmit(e) {
  e.preventDefault();
  const form = fieldForm();
  if (!form) return;

  const fd = new FormData(form);
  const id = fd.get('id') || null;

  const payload = {
    ...(id ? { id } : {}),
    name:               fd.get('name')?.trim(),
    location:           fd.get('location')?.trim(),
    district:           fd.get('district')?.trim(),
    city:               fd.get('city')?.trim() || 'TP. Hồ Chí Minh',
    capacity:           Number(fd.get('capacity')),
    price_per_hour_vnd: Number(fd.get('price')),
    surface:            fd.get('surface')?.trim(),
    description:        fd.get('description')?.trim(),
    image_url:          fd.get('image_url')?.trim() || '/assets/images/san-bong.jpg',
    is_active:          true,
  };

  if (!payload.name || !payload.location || !payload.district) {
    _dispatchToast('Vui lòng điền đầy đủ tên sân, địa chỉ và quận.');
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu...'; }

  try {
    await api.adminUpsertField(payload);
    dialog()?.close();
    _dispatchToast(id ? 'Đã cập nhật sân.' : 'Đã thêm sân mới.');
    await _loadFields();
  } catch (err) {
    console.error('[admin-fields] upsert error:', err);
    _dispatchToast('Có lỗi khi lưu sân. Vui lòng thử lại.');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Lưu'; }
  }
}

/**
 * @param {string} fieldId
 * @param {boolean} activate - true = re-activate, false = deactivate
 */
async function _handleDeactivate(fieldId, activate) {
  const field = _fields.find((f) => f.id === fieldId);
  const action = activate ? 'kích hoạt' : 'tạm ngưng';
  if (!field) return;

  if (!confirm(`Bạn có chắc muốn ${action} sân "${field.name}"?`)) return;

  try {
    if (activate) {
      await api.adminUpsertField({ id: fieldId, is_active: true });
    } else {
      await api.adminDeactivateField(fieldId);
    }
    _dispatchToast(`Đã ${action} sân "${field.name}".`);
    await _loadFields();
  } catch (err) {
    console.error('[admin-fields] deactivate error:', err);
    _dispatchToast('Có lỗi khi cập nhật sân. Vui lòng thử lại.');
  }
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function _loadFields() {
  const tbody = tableBody();
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-sm">
        <div class="inline-block w-5 h-5 border-2 border-pitch-200 border-t-pitch-600 rounded-full animate-spin"></div>
        Đang tải...
      </td></tr>`;
  }

  try {
    _fields = await api.adminListFields();
    _renderTable();
  } catch (err) {
    console.error('[admin-fields] load error:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-red-500 text-sm">
        Có lỗi khi tải danh sách sân.
      </td></tr>`;
    }
  }
}

// ─── Public init ──────────────────────────────────────────────────────────────

/**
 * Called by admin-page.js when the "Sân" tab is first activated.
 * Idempotent — subsequent calls refresh data only.
 */
export async function initFieldsTab() {
  if (!_initialized) {
    _initialized = true;

    // Wire "+ Thêm sân" button
    const addBtn = document.getElementById('btn-add-field');
    if (addBtn) addBtn.addEventListener('click', _openCreateDialog);

    // Wire dialog form submit
    const form = fieldForm();
    if (form) form.addEventListener('submit', _handleFormSubmit);

    // Wire dialog cancel / close buttons
    const dlg = dialog();
    if (dlg) {
      dlg.addEventListener('click', (e) => {
        // Close when clicking outside dialog content
        if (e.target === dlg) dlg.close();
      });
      dlg.querySelectorAll('[data-dialog-close]').forEach((btn) => {
        btn.addEventListener('click', () => dlg.close());
      });
    }
  }

  await _loadFields();
}
