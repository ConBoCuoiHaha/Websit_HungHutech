<template>
  <div class="audit-logs-container">
    <div class="page-header">
      <h1>📊 Lịch sử Truy cập Website</h1>
      <p class="subtitle">Theo dõi và giám sát hoạt động truy cập hệ thống</p>
    </div>

    <!-- Statistics Section -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.totalLogs || 0).toLocaleString() }}</div>
          <div class="stat-label">Tổng lượt truy cập</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.totalUsers || 0).toLocaleString() }}</div>
          <div class="stat-label">Người dùng hoạt động</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.avgResponseTime || 0).toFixed(0) }}ms</div>
          <div class="stat-label">Thời gian phản hồi TB</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{{ (stats.errorRate || 0).toFixed(2) }}%</div>
          <div class="stat-label">Tỷ lệ lỗi</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <input
          v-model="filters.search"
          @input="handleSearch"
          placeholder="🔍 Tìm kiếm theo endpoint, IP, user..."
          class="search-input"
        />

        <select v-model="filters.action" @change="fetchLogs" class="filter-select">
          <option value="">Tất cả hành động</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
          <option value="CREATE">CREATE</option>
          <option value="READ">READ</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="EXPORT">EXPORT</option>
        </select>

        <select v-model="filters.method" @change="fetchLogs" class="filter-select">
          <option value="">Tất cả methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>

        <input
          v-model="filters.startDate"
          @change="fetchLogs"
          type="date"
          class="date-input"
          placeholder="Từ ngày"
        />

        <input
          v-model="filters.endDate"
          @change="fetchLogs"
          type="date"
          class="date-input"
          placeholder="Đến ngày"
        />

        <button @click="resetFilters" class="btn-secondary">🔄 Reset</button>
        <button @click="showStatsModal = true" class="btn-info">📊 Thống kê</button>
      </div>
    </div>

    <!-- Logs Table -->
    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Không có dữ liệu lịch sử truy cập</p>
    </div>

    <div v-else class="table-container">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Người dùng</th>
            <th>Hành động</th>
            <th>Method</th>
            <th>Endpoint</th>
            <th>IP Address</th>
            <th>Status</th>
            <th>Response Time</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log._id" :class="{ 'error-row': log.statusCode >= 400 }">
            <td>{{ formatDateTime(log.timestamp) }}</td>
            <td>
              <div v-if="log.userId" class="user-info">
                <div class="user-name">{{ log.userId.name }}</div>
                <div class="user-email">{{ log.userId.email }}</div>
              </div>
              <span v-else class="text-muted">System</span>
            </td>
            <td>
              <span class="badge" :class="getActionClass(log.action)">
                {{ log.action }}
              </span>
            </td>
            <td>
              <span class="method-badge" :class="getMethodClass(log.method)">
                {{ log.method }}
              </span>
            </td>
            <td class="endpoint-cell">{{ log.endpoint }}</td>
            <td>{{ log.ipAddress }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(log.statusCode)">
                {{ log.statusCode }}
              </span>
            </td>
            <td>{{ log.responseTime }}ms</td>
            <td>
              <button @click="viewDetails(log)" class="btn-icon" title="Xem chi tiết">
                👁️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="btn-page"
        >
          ← Trước
        </button>
        <span class="page-info">
          Trang {{ pagination.page }} / {{ pagination.totalPages }}
          ({{ pagination.total }} bản ghi)
        </span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="btn-page"
        >
          Sau →
        </button>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>📄 Chi tiết Log</h2>
          <button @click="showDetailsModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedLog" class="details-grid">
            <div class="detail-item">
              <strong>Thời gian:</strong>
              <span>{{ formatDateTime(selectedLog.timestamp) }}</span>
            </div>
            <div class="detail-item">
              <strong>Người dùng:</strong>
              <span v-if="selectedLog.userId">
                {{ selectedLog.userId.name }} ({{ selectedLog.userId.email }})
              </span>
              <span v-else>System</span>
            </div>
            <div class="detail-item">
              <strong>Hành động:</strong>
              <span class="badge" :class="getActionClass(selectedLog.action)">
                {{ selectedLog.action }}
              </span>
            </div>
            <div class="detail-item">
              <strong>Method:</strong>
              <span class="method-badge" :class="getMethodClass(selectedLog.method)">
                {{ selectedLog.method }}
              </span>
            </div>
            <div class="detail-item">
              <strong>Endpoint:</strong>
              <code>{{ selectedLog.endpoint }}</code>
            </div>
            <div class="detail-item">
              <strong>Resource:</strong>
              <span>{{ selectedLog.resource }}</span>
            </div>
            <div class="detail-item">
              <strong>IP Address:</strong>
              <span>{{ selectedLog.ipAddress }}</span>
            </div>
            <div class="detail-item">
              <strong>User Agent:</strong>
              <span class="text-small">{{ selectedLog.userAgent || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <strong>Status Code:</strong>
              <span class="status-badge" :class="getStatusClass(selectedLog.statusCode)">
                {{ selectedLog.statusCode }}
              </span>
            </div>
            <div class="detail-item">
              <strong>Response Time:</strong>
              <span>{{ selectedLog.responseTime }}ms</span>
            </div>
            <div v-if="selectedLog.details" class="detail-item full-width">
              <strong>Chi tiết:</strong>
              <pre class="json-viewer">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Modal -->
    <div v-if="showStatsModal" class="modal-overlay" @click.self="showStatsModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>📊 Thống kê Chi tiết</h2>
          <button @click="showStatsModal = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="stats" class="stats-details">
            <!-- Top Users -->
            <div class="stats-section">
              <h3>👥 Top Người dùng Hoạt động</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Số lượt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in stats.topUsers" :key="user._id">
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td><strong>{{ user.count }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Top IPs -->
            <div class="stats-section">
              <h3>🌐 Top IP Addresses</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Số lượt truy cập</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ip in stats.topIPs" :key="ip._id">
                    <td>{{ ip._id }}</td>
                    <td><strong>{{ ip.count }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Top Actions -->
            <div class="stats-section">
              <h3>⚡ Top Hành động</h3>
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>Hành động</th>
                    <th>Số lần thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="action in stats.topActions" :key="action._id">
                    <td>
                      <span class="badge" :class="getActionClass(action._id)">
                        {{ action._id }}
                      </span>
                    </td>
                    <td><strong>{{ action.count }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import auditLogsService, { type AuditLog, type AuditStats } from '@/services/auditLogsService';

const logs = ref<AuditLog[]>([]);
const stats = ref<AuditStats | null>(null);
const loading = ref(false);
const showDetailsModal = ref(false);
const showStatsModal = ref(false);
const selectedLog = ref<AuditLog | null>(null);

const filters = ref({
  search: '',
  action: '',
  method: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 20
});

const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1
});

let searchTimeout: NodeJS.Timeout;

onMounted(() => {
  fetchLogs();
  fetchStats();
});

async function fetchLogs() {
  loading.value = true;
  try {
    const params: any = {
      page: filters.value.page,
      limit: filters.value.limit
    };

    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.method) params.method = filters.value.method;
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    const response = await auditLogsService.getAll(params);
    logs.value = response.data;
    pagination.value = response.pagination;
  } catch (error: any) {
    alert('❌ Lỗi: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const params: any = {};
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    stats.value = await auditLogsService.getStats(params.startDate, params.endDate);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
  }
}

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filters.value.page = 1;
    fetchLogs();
  }, 500);
}

function resetFilters() {
  filters.value = {
    search: '',
    action: '',
    method: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  };
  fetchLogs();
  fetchStats();
}

function changePage(page: number) {
  filters.value.page = page;
  fetchLogs();
}

function viewDetails(log: AuditLog) {
  selectedLog.value = log;
  showDetailsModal.value = true;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getActionClass(action: string): string {
  const classes: Record<string, string> = {
    'LOGIN': 'badge-success',
    'LOGOUT': 'badge-info',
    'CREATE': 'badge-primary',
    'READ': 'badge-secondary',
    'UPDATE': 'badge-warning',
    'DELETE': 'badge-danger',
    'EXPORT': 'badge-info'
  };
  return classes[action] || 'badge-secondary';
}

function getMethodClass(method: string): string {
  const classes: Record<string, string> = {
    'GET': 'method-get',
    'POST': 'method-post',
    'PUT': 'method-put',
    'PATCH': 'method-patch',
    'DELETE': 'method-delete'
  };
  return classes[method] || '';
}

function getStatusClass(status: number): string {
  if (status >= 200 && status < 300) return 'status-success';
  if (status >= 300 && status < 400) return 'status-redirect';
  if (status >= 400 && status < 500) return 'status-client-error';
  if (status >= 500) return 'status-server-error';
  return '';
}
</script>

<style scoped>
.audit-logs-container {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 14px;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

/* Filters */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select,
.date-input {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.btn-secondary,
.btn-info {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-info {
  background: #2196F3;
  color: white;
}

.btn-info:hover {
  background: #1976D2;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.audit-table th {
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.audit-table tbody tr:hover {
  background: #f8f9fa;
}

.error-row {
  background: #fff5f5 !important;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success { background: #d4edda; color: #155724; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-primary { background: #cce5ff; color: #004085; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger { background: #f8d7da; color: #721c24; }

.method-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
}

.method-get { background: #61affe; color: white; }
.method-post { background: #49cc90; color: white; }
.method-put { background: #fca130; color: white; }
.method-patch { background: #50e3c2; color: white; }
.method-delete { background: #f93e3e; color: white; }

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
}

.status-success { background: #4caf50; color: white; }
.status-redirect { background: #ff9800; color: white; }
.status-client-error { background: #f44336; color: white; }
.status-server-error { background: #9c27b0; color: white; }

/* User Info */
.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-email {
  font-size: 12px;
  color: #666;
}

.endpoint-cell {
  font-family: monospace;
  font-size: 13px;
  color: #666;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Action Buttons */
.btn-icon {
  padding: 6px 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-page {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

/* Loading & Empty States */
.loading,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item strong {
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 0.5px;
}

.detail-item code {
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
}

.json-viewer {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

.text-small {
  font-size: 12px;
  color: #666;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* Stats Details */
.stats-details {
  display: grid;
  gap: 32px;
}

.stats-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.stats-table thead {
  background: #f5f5f5;
}

.stats-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.stats-table td {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
}

.stats-table tbody tr:hover {
  background: #f8f9fa;
}
</style>
