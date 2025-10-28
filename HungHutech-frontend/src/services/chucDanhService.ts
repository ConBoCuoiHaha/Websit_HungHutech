import api from './api';
import {ChucDanh, PaginatedResponse, PaginationParams} from '@/types';

class ChucDanhService {
  private readonly BASE_URL = '/chucdanh';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ChucDanh>> {
    const response = await api.get<PaginatedResponse<ChucDanh>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<ChucDanh> {
    const response = await api.get<ChucDanh>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<ChucDanh>): Promise<ChucDanh> {
    const response = await api.post<ChucDanh>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<ChucDanh>): Promise<ChucDanh> {
    const response = await api.put<ChucDanh>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ChucDanhService();
