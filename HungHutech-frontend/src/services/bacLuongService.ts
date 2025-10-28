import api from './api';
import {BacLuong, PaginatedResponse, PaginationParams} from '@/types';

class BacLuongService {
  private readonly BASE_URL = '/bacluong';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<BacLuong>> {
    const response = await api.get<PaginatedResponse<BacLuong>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<BacLuong> {
    const response = await api.get<BacLuong>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<BacLuong>): Promise<BacLuong> {
    const response = await api.post<BacLuong>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<BacLuong>): Promise<BacLuong> {
    const response = await api.put<BacLuong>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new BacLuongService();
