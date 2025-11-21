import api from './api';
import {YeuCauNghiPhep, PaginatedResponse, PaginationParams} from '@/types';

interface YeuCauNghiPhepParams extends PaginationParams {
  nhan_vien_id?: string;
  trang_thai?: 'Cho duyet' | 'Da duyet' | 'Bi tu choi' | 'Da huy';
  from?: string;
  to?: string;
}

interface UpdateStatusRequest {
  trang_thai: 'Cho duyet' | 'Da duyet' | 'Bi tu choi' | 'Da huy';
  nguoi_duyet_id?: string;
  ghi_chu_quan_ly?: string;
}

class YeuCauNghiPhepService {
  private readonly BASE_URL = '/yeucaunghiphep';

  async getAll(
    params?: YeuCauNghiPhepParams,
  ): Promise<PaginatedResponse<YeuCauNghiPhep>> {
    const response = await api.get<PaginatedResponse<YeuCauNghiPhep>>(
      this.BASE_URL,
      {
        params,
      },
    );
    return response.data;
  }

  async getById(id: string): Promise<YeuCauNghiPhep> {
    const response = await api.get<YeuCauNghiPhep>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async getMy(
    params?: Pick<YeuCauNghiPhepParams, 'page' | 'limit' | 'trang_thai'>,
  ): Promise<PaginatedResponse<YeuCauNghiPhep>> {
    const response = await api.get<PaginatedResponse<YeuCauNghiPhep>>(
      `${this.BASE_URL}/my`,
      {params},
    );
    return response.data;
  }

  async create(data: Partial<YeuCauNghiPhep>): Promise<YeuCauNghiPhep> {
    const response = await api.post<YeuCauNghiPhep>(this.BASE_URL, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    data: UpdateStatusRequest,
  ): Promise<YeuCauNghiPhep> {
    const response = await api.put<YeuCauNghiPhep>(
      `${this.BASE_URL}/${id}/status`,
      data,
    );
    return response.data;
  }

  async cancel(id: string): Promise<YeuCauNghiPhep> {
    const response = await api.put<YeuCauNghiPhep>(
      `${this.BASE_URL}/${id}/cancel`,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new YeuCauNghiPhepService();
