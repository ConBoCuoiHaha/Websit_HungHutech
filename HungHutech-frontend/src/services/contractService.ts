import api from './api';
import {PaginatedResponse} from '@/types';

export interface Contract {
  _id: string;
  nhan_vien_id: string;
  so_hop_dong: string;
  loai_hop_dong: 'Thu_viec' | 'Co_thoi_han' | 'Khong_thoi_han' | 'Cong_tac';
  trang_thai: 'Draft' | 'Cho_duyet' | 'Da_ky' | 'Da_huy';
  ngay_ky?: string;
  hieu_luc_tu?: string;
  hieu_luc_den?: string;
  luong_co_ban?: number;
  phu_cap?: Array<{ten: string; so_tien: number; ghi_chu?: string}>;
  file_url?: string;
  ghi_chu?: string;
}

export interface ContractParams {
  page?: number;
  limit?: number;
  q?: string;
  nhan_vien_id?: string;
  trang_thai?: string;
}

class ContractService {
  private readonly BASE_URL = '/contracts';

  async getAll(params?: ContractParams): Promise<PaginatedResponse<Contract>> {
    const response = await api.get<PaginatedResponse<Contract>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<Contract> {
    const response = await api.get<Contract>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Contract>): Promise<Contract> {
    const response = await api.post<Contract>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Contract>): Promise<Contract> {
    const response = await api.put<Contract>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    trang_thai: Contract['trang_thai'],
    ghi_chu?: string,
  ) {
    const response = await api.patch<Contract>(
      `${this.BASE_URL}/${id}/status`,
      {
        trang_thai,
        ghi_chu,
      },
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async getExpiring(params?: {days?: number; limit?: number}): Promise<Contract[]> {
    const response = await api.get<{data: Contract[]}>(`${this.BASE_URL}/expiring`, {
      params,
    });
    return response.data.data || [];
  }
}

export default new ContractService();
