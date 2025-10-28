import api from './api';
import {DiaDiem, PaginatedResponse, PaginationParams} from '@/types';

class DiaDiemService {
  private readonly BASE_URL = '/diadiem';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<DiaDiem>> {
    const response = await api.get<PaginatedResponse<DiaDiem>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<DiaDiem> {
    const response = await api.get<DiaDiem>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<DiaDiem>): Promise<DiaDiem> {
    const response = await api.post<DiaDiem>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<DiaDiem>): Promise<DiaDiem> {
    const response = await api.put<DiaDiem>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new DiaDiemService();
