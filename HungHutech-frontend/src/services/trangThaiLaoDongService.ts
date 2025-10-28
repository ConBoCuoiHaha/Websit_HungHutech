import api from './api';
import {TrangThaiLaoDong, PaginatedResponse, PaginationParams} from '@/types';

class TrangThaiLaoDongService {
  private readonly BASE_URL = '/trangthailaodong';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<TrangThaiLaoDong>> {
    const response = await api.get<PaginatedResponse<TrangThaiLaoDong>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<TrangThaiLaoDong> {
    const response = await api.get<TrangThaiLaoDong>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<TrangThaiLaoDong>): Promise<TrangThaiLaoDong> {
    const response = await api.post<TrangThaiLaoDong>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<TrangThaiLaoDong>): Promise<TrangThaiLaoDong> {
    const response = await api.put<TrangThaiLaoDong>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new TrangThaiLaoDongService();
