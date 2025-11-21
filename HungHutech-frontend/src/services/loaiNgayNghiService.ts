import api from './api';
import {LoaiNgayNghi, PaginatedResponse, PaginationParams} from '@/types';

class LoaiNgayNghiService {
  private readonly BASE_URL = '/loaingaynghi';

  async getAll(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<LoaiNgayNghi>> {
    const response = await api.get<PaginatedResponse<LoaiNgayNghi>>(
      this.BASE_URL,
      {
        params,
      },
    );
    return response.data;
  }

  async getById(id: string): Promise<LoaiNgayNghi> {
    const response = await api.get<LoaiNgayNghi>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<LoaiNgayNghi>): Promise<LoaiNgayNghi> {
    const response = await api.post<LoaiNgayNghi>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<LoaiNgayNghi>): Promise<LoaiNgayNghi> {
    const response = await api.put<LoaiNgayNghi>(
      `${this.BASE_URL}/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new LoaiNgayNghiService();
