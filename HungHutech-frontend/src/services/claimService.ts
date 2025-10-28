import api from './api';
import {Claim, PaginatedResponse, PaginationParams} from '@/types';

class ClaimService {
  private readonly BASE_URL = '/claims';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Claim>> {
    const response = await api.get<PaginatedResponse<Claim>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<Claim> {
    const response = await api.get<Claim>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async getByNhanVienId(nhanVienId: string, params?: PaginationParams): Promise<PaginatedResponse<Claim>> {
    const response = await api.get<PaginatedResponse<Claim>>(this.BASE_URL, {
      params: {...params, nhan_vien_id: nhanVienId},
    });
    return response.data;
  }

  async create(data: Partial<Claim>): Promise<Claim> {
    const response = await api.post<Claim>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Claim>): Promise<Claim> {
    const response = await api.put<Claim>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    trang_thai: 'Submitted' | 'Approved' | 'Rejected' | 'Paid',
    ghi_chu?: string,
  ): Promise<Claim> {
    const response = await api.put<Claim>(`${this.BASE_URL}/${id}`, {
      trang_thai,
      ghi_chu,
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ClaimService();
