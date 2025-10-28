import api from './api';
import {PhongBan, PaginatedResponse, PaginationParams} from '@/types';

class PhongBanService {
  private readonly BASE_URL = '/phongban';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<PhongBan>> {
    const response = await api.get<PaginatedResponse<PhongBan>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<PhongBan> {
    const response = await api.get<PhongBan>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<PhongBan>): Promise<PhongBan> {
    const response = await api.post<PhongBan>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<PhongBan>): Promise<PhongBan> {
    const response = await api.put<PhongBan>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new PhongBanService();
