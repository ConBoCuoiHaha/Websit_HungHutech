import api from './api';
import {NhanVien, PaginatedResponse} from '@/types';

export interface OffboardingTask {
  _id: string;
  name: string;
  department?: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  due_date?: string;
  note?: string;
  completed_at?: string;
  tempNote?: string;
}

export interface OffboardingRequest {
  _id: string;
  nhan_vien_id: NhanVien | string;
  last_working_day?: string;
  reason?: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  tasks: OffboardingTask[];
  ngay_tao?: string;
}

export interface OffboardingParams {
  page?: number;
  limit?: number;
  status?: string;
}

class OffboardingService {
  private readonly BASE_URL = '/offboarding';

  async getAll(params?: OffboardingParams): Promise<PaginatedResponse<OffboardingRequest>> {
    const response = await api.get<PaginatedResponse<OffboardingRequest>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<OffboardingRequest> {
    const response = await api.get<OffboardingRequest>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(payload: {nhan_vien_id: string; last_working_day?: string; reason?: string}) {
    const response = await api.post<OffboardingRequest>(this.BASE_URL, payload);
    return response.data;
  }

  async updateStatus(id: string, status: OffboardingRequest['status'], note?: string) {
    const response = await api.patch<OffboardingRequest>(`${this.BASE_URL}/${id}/status`, {
      status,
      note,
    });
    return response.data;
  }

  async updateTask(id: string, taskId: string, data: Partial<{status: OffboardingTask['status']; note: string; due_date: string}>) {
    const response = await api.patch<OffboardingRequest>(`${this.BASE_URL}/${id}/tasks/${taskId}`, data);
    return response.data;
  }

  async getUpcoming(params?: {days?: number; limit?: number}): Promise<OffboardingRequest[]> {
    const response = await api.get<{data: OffboardingRequest[]}>(`${this.BASE_URL}/upcoming`, {
      params,
    });
    return response.data.data || [];
  }
}

export default new OffboardingService();
