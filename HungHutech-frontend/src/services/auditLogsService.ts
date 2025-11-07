import api from './api';

export interface AuditLog {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  action: string;
  resource: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  statusCode: number;
  responseTime: number;
  details?: any;
  timestamp: string;
  createdAt?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditStats {
  totalLogs: number;
  totalUsers: number;
  avgResponseTime: number;
  errorRate: number;
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    count: number;
  }>;
  topIPs: Array<{
    _id: string;
    count: number;
  }>;
  topActions: Array<{
    _id: string;
    count: number;
  }>;
  actionsByDay: Array<{
    _id: string;
    count: number;
  }>;
}

class AuditLogsService {
  private readonly BASE_URL = '/audit-logs';

  async getAll(params?: any): Promise<PaginatedAuditLogs> {
    const response = await api.get<PaginatedAuditLogs>(this.BASE_URL, { params });
    return response.data;
  }

  async getById(id: string): Promise<AuditLog> {
    const response = await api.get<AuditLog>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async getStats(startDate?: string, endDate?: string): Promise<AuditStats> {
    const response = await api.get<AuditStats>(`${this.BASE_URL}/stats`, {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async getByUser(userId: string, params?: any): Promise<PaginatedAuditLogs> {
    const response = await api.get<PaginatedAuditLogs>(`${this.BASE_URL}/user/${userId}`, { params });
    return response.data;
  }

  async getByIP(ipAddress: string, params?: any): Promise<PaginatedAuditLogs> {
    const response = await api.get<PaginatedAuditLogs>(`${this.BASE_URL}/ip/${ipAddress}`, { params });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async cleanup(daysOld: number): Promise<{ message: string; deletedCount: number }> {
    const response = await api.post<{ message: string; deletedCount: number }>(`${this.BASE_URL}/cleanup`, { daysOld });
    return response.data;
  }
}

export default new AuditLogsService();
