import api from './api';
import {PerformanceReview, PaginatedResponse, PaginationParams} from '@/types';

class PerformanceReviewService {
  private readonly BASE_URL = '/performance/reviews';

  async getAll(
    params?: PaginationParams & {nhan_vien_id?: string},
  ): Promise<PaginatedResponse<PerformanceReview>> {
    const response = await api.get<PaginatedResponse<PerformanceReview>>(
      this.BASE_URL,
      {params},
    );
    return response.data;
  }

  async getMine(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<PerformanceReview>> {
    const response = await api.get<PaginatedResponse<PerformanceReview>>(
      `${this.BASE_URL}/my`,
      {params},
    );
    return response.data;
  }

  async getById(id: string): Promise<PerformanceReview> {
    const response = await api.get<PerformanceReview>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const response = await api.post<PerformanceReview>(this.BASE_URL, data);
    return response.data;
  }

  async update(
    id: string,
    data: Partial<PerformanceReview>,
  ): Promise<PerformanceReview> {
    const response = await api.put<PerformanceReview>(
      `${this.BASE_URL}/${id}`,
      data,
    );
    return response.data;
  }

  async updateStatus(
    id: string,
    trang_thai: 'Draft' | 'InReview' | 'Completed',
  ): Promise<PerformanceReview> {
    const response = await api.put<PerformanceReview>(
      `${this.BASE_URL}/${id}`,
      {
        trang_thai,
      },
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new PerformanceReviewService();
