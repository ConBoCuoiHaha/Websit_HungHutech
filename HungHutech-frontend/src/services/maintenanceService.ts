import api from './api';
import {
  PurgeableEmployee,
  PurgeableCandidate,
  PurgeableResponse,
  PurgeLog,
  PurgeLogsResponse,
} from '@/types';

interface PurgeRequest {
  ly_do: string;
}

interface PurgeLogsParams {
  page?: number;
  limit?: number;
  loai?: 'NhanVien' | 'UngVien';
  nguoi_thuc_hien_id?: string;
  tu_ngay?: string;
  den_ngay?: string;
}

class MaintenanceService {
  private readonly BASE_URL = '/maintenance';

  // Employee Purge Methods
  async getEmployeesForPurge(): Promise<PurgeableResponse<PurgeableEmployee>> {
    const response = await api.get<PurgeableResponse<PurgeableEmployee>>(
      `${this.BASE_URL}/employees/purgeable`,
    );
    return response.data;
  }

  async purgeEmployee(
    id: string,
    ly_do: string,
  ): Promise<{msg: string; summary: any}> {
    const response = await api.post<{msg: string; summary: any}>(
      `${this.BASE_URL}/employees/${id}/purge`,
      {ly_do} as PurgeRequest,
    );
    return response.data;
  }

  // Candidate Purge Methods
  async getCandidatesForPurge(): Promise<
    PurgeableResponse<PurgeableCandidate>
  > {
    const response = await api.get<PurgeableResponse<PurgeableCandidate>>(
      `${this.BASE_URL}/candidates/purgeable`,
    );
    return response.data;
  }

  async purgeCandidate(
    id: string,
    ly_do: string,
  ): Promise<{msg: string; summary: any}> {
    const response = await api.post<{msg: string; summary: any}>(
      `${this.BASE_URL}/candidates/${id}/purge`,
      {ly_do} as PurgeRequest,
    );
    return response.data;
  }

  // Audit Logs Methods
  async getPurgeLogs(params?: PurgeLogsParams): Promise<PurgeLogsResponse> {
    const response = await api.get<PurgeLogsResponse>(`${this.BASE_URL}/logs`, {
      params,
    });
    return response.data;
  }
}

export default new MaintenanceService();
