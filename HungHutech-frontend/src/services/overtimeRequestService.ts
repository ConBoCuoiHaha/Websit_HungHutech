import api from './api';
import {PaginatedResponse, OvertimeAlertGroups} from '@/types';

export interface OvertimeRequest {
  _id: string;
  nhan_vien_id: any;
  ngay: string;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  so_gio: number;
  loai_ngay: string;
  he_so: number;
  trang_thai: 'Cho duyet' | 'Da duyet' | 'Bi tu choi' | 'Da huy';
  ly_do?: string;
  ghi_chu_quan_ly?: string;
  nguoi_duyet_id?: any;
  ngay_tao?: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  nhan_vien_id?: string;
  trang_thai?: string;
  from?: string;
  to?: string;
  q?: string;
}

class OvertimeRequestService {
  private readonly BASE_URL = '/overtime-requests';

  async getAll(params?: ListParams): Promise<PaginatedResponse<OvertimeRequest>> {
    const response = await api.get<PaginatedResponse<OvertimeRequest>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getMy(
    params?: Pick<ListParams, 'page' | 'limit' | 'trang_thai'>,
  ): Promise<PaginatedResponse<OvertimeRequest>> {
    const response = await api.get<PaginatedResponse<OvertimeRequest>>(
      `${this.BASE_URL}/my`,
      {params},
    );
    return response.data;
  }

  async create(data: {
    ngay: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    ly_do?: string;
    nhan_vien_id?: string;
  }): Promise<OvertimeRequest | undefined> {
    const response = await api.post<OvertimeRequest>(this.BASE_URL, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    data: {trang_thai: 'Da duyet' | 'Bi tu choi'; ghi_chu_quan_ly?: string},
  ): Promise<OvertimeRequest> {
    const response = await api.put<OvertimeRequest>(
      `${this.BASE_URL}/${id}/status`,
      data,
    );
    return response.data;
  }

  async cancel(id: string): Promise<OvertimeRequest> {
    const response = await api.put<OvertimeRequest>(
      `${this.BASE_URL}/${id}/cancel`,
    );
    return response.data;
  }

  async getAlerts(): Promise<OvertimeAlertGroups> {
    const response = await api.get<OvertimeAlertGroups>(`${this.BASE_URL}/alerts`);
    return response.data;
  }
}

export default new OvertimeRequestService();
