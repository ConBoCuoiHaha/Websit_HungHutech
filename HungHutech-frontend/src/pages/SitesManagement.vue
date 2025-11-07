<template>
  <div class="sites-container">
    <div class="page-header">
      <h1>📍 Quản lý Địa điểm Chấm công</h1>
      <p class="subtitle">Quản lý các địa điểm cho phép nhân viên chấm công qua ứng dụng di động</p>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="🔍 Tìm kiếm theo tên, địa chỉ, mã..."
          class="search-input"
        />
      </div>
      <button @click="openCreateForm" class="btn-primary">
        ➕ Thêm địa điểm
      </button>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="sites-table" v-if="!loading && sites.length > 0">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên địa điểm</th>
            <th>Địa chỉ</th>
            <th>Tọa độ (Lat, Lng)</th>
            <th>Bán kính</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th class="actions-col">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="site in sites" :key="site._id">
            <td><strong>{{ site.siteId }}</strong></td>
            <td>{{ site.name }}</td>
            <td>{{ site.address }}</td>
            <td class="coordinates">
              <span>{{ site.latitude?.toFixed(6) }}, {{ site.longitude?.toFixed(6) }}</span>
            </td>
            <td><span class="radius-badge">{{ site.radius }}m</span></td>
            <td>
              <span :class="site.isActive ? 'status-active' : 'status-inactive'">
                {{ site.isActive ? '🟢 Hoạt động' : '🔴 Tắt' }}
              </span>
            </td>
            <td>{{ formatDate(site.createdAt) }}</td>
            <td class="actions-col">
              <button @click="editSite(site)" class="btn-action btn-edit" title="Sửa">
                ✏️
              </button>
              <button @click="toggleSite(site)" class="btn-action btn-toggle" :title="site.isActive ? 'Tắt' : 'Bật'">
                {{ site.isActive ? '🔴' : '🟢' }}
              </button>
              <button @click="deleteSite(site)" class="btn-action btn-delete" title="Xóa">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && sites.length === 0" class="empty-state">
        <p>📭 Chưa có địa điểm nào</p>
        <button @click="openCreateForm" class="btn-primary">Thêm địa điểm đầu tiên</button>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingId ? '✏️ Sửa' : '➕ Thêm' }} Địa điểm</h2>
          <button @click="closeForm" class="btn-close">✖</button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-group">
            <label class="form-label required">Tên địa điểm</label>
            <input
              v-model="form.name"
              type="text"
              class="form-control"
              placeholder="VD: Văn phòng chính - Q1"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label required">Địa chỉ</label>
            <input
              v-model="form.address"
              type="text"
              class="form-control"
              placeholder="VD: 208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Vĩ độ (Latitude)</label>
              <input
                v-model.number="form.latitude"
                type="number"
                step="any"
                class="form-control"
                placeholder="VD: 10.7756"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label required">Kinh độ (Longitude)</label>
              <input
                v-model.number="form.longitude"
                type="number"
                step="any"
                class="form-control"
                placeholder="VD: 106.7009"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <button
              type="button"
              @click="getCurrentLocation"
              class="btn-secondary"
              :disabled="gettingLocation"
            >
              {{ gettingLocation ? '⏳ Đang lấy...' : '📍 Lấy vị trí hiện tại' }}
            </button>
            <small class="form-text">Sử dụng GPS của trình duyệt để lấy tọa độ hiện tại</small>
          </div>

          <div class="form-group">
            <label class="form-label required">Bán kính cho phép (m)</label>
            <input
              v-model.number="form.radius"
              type="number"
              min="10"
              max="1000"
              class="form-control"
              required
            />
            <small class="form-text">Nhân viên cần ở trong bán kính {{ form.radius }}m để chấm công</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isActive" type="checkbox" />
              <span>Kích hoạt địa điểm</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn-cancel">
              Hủy
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? '⏳ Đang lưu...' : '💾 Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import sitesService, { type Site } from '@/services/sitesService';

const sites = ref<Site[]>([]);
const searchQuery = ref('');
const loading = ref(false);
const saving = ref(false);
const gettingLocation = ref(false);
const showForm = ref(false);
const editingId = ref<string | null>(null);

const form = ref({
  name: '',
  address: '',
  longitude: 106.7009,
  latitude: 10.7756,
  radius: 150,
  isActive: true
});

onMounted(() => {
  loadSites();
});

async function loadSites() {
  try {
    loading.value = true;
    const response = await sitesService.getAll({
      q: searchQuery.value,
      limit: 100
    });
    sites.value = response.data;
  } catch (error: any) {
    console.error('Error loading sites:', error);
    alert('❌ Lỗi khi tải danh sách địa điểm: ' + (error.response?.data?.msg || error.message));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadSites();
}

function openCreateForm() {
  editingId.value = null;
  form.value = {
    name: '',
    address: '',
    longitude: 106.7009,
    latitude: 10.7756,
    radius: 150,
    isActive: true
  };
  showForm.value = true;
}

function editSite(site: Site) {
  editingId.value = site._id!;
  form.value = {
    name: site.name,
    address: site.address,
    longitude: site.longitude!,
    latitude: site.latitude!,
    radius: site.radius,
    isActive: site.isActive
  };
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
}

async function handleSubmit() {
  try {
    saving.value = true;

    if (editingId.value) {
      await sitesService.update(editingId.value, form.value);
      alert('✅ Cập nhật thành công!');
    } else {
      await sitesService.create(form.value);
      alert('✅ Thêm địa điểm thành công!');
    }

    closeForm();
    loadSites();
  } catch (error: any) {
    console.error('Error saving site:', error);
    alert('❌ Lỗi: ' + (error.response?.data?.msg || error.message));
  } finally {
    saving.value = false;
  }
}

async function toggleSite(site: Site) {
  const action = site.isActive ? 'tắt' : 'bật';
  if (!confirm(`Bạn có chắc muốn ${action} địa điểm "${site.name}"?`)) return;

  try {
    await sitesService.toggle(site._id!);
    alert(`✅ Đã ${action} địa điểm thành công!`);
    loadSites();
  } catch (error: any) {
    console.error('Error toggling site:', error);
    alert('❌ Lỗi khi cập nhật trạng thái: ' + (error.response?.data?.msg || error.message));
  }
}

async function deleteSite(site: Site) {
  if (!confirm(`⚠️ Xóa địa điểm "${site.name}"?\n\nThao tác này không thể hoàn tác!`)) return;

  try {
    await sitesService.delete(site._id!);
    alert('✅ Xóa thành công!');
    loadSites();
  } catch (error: any) {
    console.error('Error deleting site:', error);
    alert('❌ Lỗi khi xóa: ' + (error.response?.data?.msg || error.message));
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('❌ Trình duyệt không hỗ trợ Geolocation');
    return;
  }

  gettingLocation.value = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.value.latitude = position.coords.latitude;
      form.value.longitude = position.coords.longitude;
      gettingLocation.value = false;
      alert('✅ Đã lấy vị trí hiện tại!\n\nLat: ' + position.coords.latitude.toFixed(6) + '\nLng: ' + position.coords.longitude.toFixed(6));
    },
    (error) => {
      gettingLocation.value = false;
      console.error('Geolocation error:', error);
      alert('❌ Không thể lấy vị trí:\n' + error.message + '\n\nVui lòng:\n1. Bật GPS\n2. Cho phép trình duyệt truy cập vị trí\n3. Sử dụng HTTPS');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN');
}
</script>

<style scoped>
.sites-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 14px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.sites-table {
  width: 100%;
  border-collapse: collapse;
}

.sites-table th,
.sites-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.sites-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sites-table tbody tr:hover {
  background: #f8f9fa;
  transition: background 0.2s;
}

.coordinates {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #666;
}

.radius-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  color: #27ae60;
  font-weight: 600;
}

.status-inactive {
  color: #e74c3c;
  font-weight: 600;
}

.actions-col {
  width: 150px;
  text-align: center !important;
}

.btn-action {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  margin: 0 2px;
  border-radius: 6px;
  transition: background 0.2s, transform 0.1s;
}

.btn-action:hover {
  transform: scale(1.1);
}

.btn-edit:hover {
  background: #fff3cd;
}

.btn-toggle:hover {
  background: #d1ecf1;
}

.btn-delete:hover {
  background: #f8d7da;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #95a5a6;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.form-label.required::after {
  content: ' *';
  color: #e74c3c;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-text {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #7f8c8d;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #d5dbdb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #2c3e50;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  background: #ecf0f1;
  color: #2c3e50;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-cancel:hover {
  background: #d5dbdb;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
