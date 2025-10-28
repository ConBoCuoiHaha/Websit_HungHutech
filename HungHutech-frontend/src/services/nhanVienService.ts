import api from './api';
import {NhanVien, PaginatedResponse, PaginationParams} from '@/types';

class NhanVienService {
  private readonly BASE_URL = '/nhanvien';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<NhanVien>> {
    const response = await api.get<PaginatedResponse<NhanVien>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<NhanVien> {
    const response = await api.get<NhanVien>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<NhanVien>): Promise<NhanVien> {
    const response = await api.post<NhanVien>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<NhanVien>): Promise<NhanVien> {
    const response = await api.put<NhanVien>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new NhanVienService();
