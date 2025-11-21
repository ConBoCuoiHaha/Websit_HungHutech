import api from './api';
import {PaginatedResponse, PaginationParams, CaLamViec} from '@/types';

class CaLamViecService {
  private readonly BASE_URL = '/calamviec';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CaLamViec>> {
    const response = await api.get<PaginatedResponse<CaLamViec>>(
      this.BASE_URL,
      {
        params,
      },
    );
    return response.data;
  }

  async getById(id: string): Promise<CaLamViec> {
    const response = await api.get<CaLamViec>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<CaLamViec>): Promise<CaLamViec> {
    const response = await api.post<CaLamViec>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<CaLamViec>): Promise<CaLamViec> {
    const response = await api.put<CaLamViec>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new CaLamViecService();
