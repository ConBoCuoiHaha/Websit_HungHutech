import api from './api';
import {
  PerformanceTracker,
  PerformanceGoal,
  PerformanceOverallReview,
  PerformanceTrackerStatistics,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

class PerformanceTrackerService {
  private readonly BASE_URL = '/performance/trackers';

  async getAll(
    params?: PaginationParams & {
      nhan_vien_id?: string;
      nguoi_danh_gia_id?: string;
      trang_thai?: string;
      tu_ngay?: string;
      den_ngay?: string;
    },
  ): Promise<PaginatedResponse<PerformanceTracker>> {
    const response = await api.get<PaginatedResponse<PerformanceTracker>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<PerformanceTracker> {
    const response = await api.get<PerformanceTracker>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<PerformanceTracker>): Promise<PerformanceTracker> {
    const response = await api.post<PerformanceTracker>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<PerformanceTracker>): Promise<PerformanceTracker> {
    const response = await api.put<PerformanceTracker>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async addGoal(trackerId: string, goalData: Partial<PerformanceGoal>): Promise<PerformanceTracker> {
    const response = await api.post<PerformanceTracker>(
      `${this.BASE_URL}/${trackerId}/goals`,
      goalData,
    );
    return response.data;
  }

  async updateGoal(
    goalId: string,
    goalData: Partial<PerformanceGoal>,
  ): Promise<PerformanceTracker> {
    const response = await api.put<PerformanceTracker>(`${this.BASE_URL}/goals/${goalId}`, goalData);
    return response.data;
  }

  async deleteGoal(goalId: string): Promise<PerformanceTracker> {
    const response = await api.delete<PerformanceTracker>(`${this.BASE_URL}/goals/${goalId}`);
    return response.data;
  }

  async updateOverallReview(
    trackerId: string,
    reviewData: PerformanceOverallReview,
  ): Promise<PerformanceTracker> {
    const response = await api.put<PerformanceTracker>(
      `${this.BASE_URL}/${trackerId}/overall-review`,
      reviewData,
    );
    return response.data;
  }

  async getStatistics(params?: {
    nhan_vien_id?: string;
    nguoi_danh_gia_id?: string;
    tu_ngay?: string;
    den_ngay?: string;
  }): Promise<PerformanceTrackerStatistics> {
    const response = await api.get<PerformanceTrackerStatistics>(`${this.BASE_URL}/statistics`, {
      params,
    });
    return response.data;
  }
}

export default new PerformanceTrackerService();
