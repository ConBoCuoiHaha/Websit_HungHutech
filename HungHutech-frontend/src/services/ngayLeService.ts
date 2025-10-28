import api from './api';
import {NgayLe, PaginatedResponse, PaginationParams} from '@/types';

class NgayLeService {
  private readonly BASE_URL = '/ngay-le';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<NgayLe>> {
    const response = await api.get<PaginatedResponse<NgayLe>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<NgayLe> {
    const response = await api.get<NgayLe>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<NgayLe>): Promise<NgayLe> {
    const response = await api.post<NgayLe>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<NgayLe>): Promise<NgayLe> {
    const response = await api.put<NgayLe>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new NgayLeService();
