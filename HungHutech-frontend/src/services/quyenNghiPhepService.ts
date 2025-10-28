import api from './api';
import {QuyenNghiPhep, PaginatedResponse, PaginationParams, LeaveBalance} from '@/types';

interface QuyenNghiPhepParams extends PaginationParams {
  nhan_vien_id?: string;
  loai_ngay_nghi_id?: string;
  nam?: number;
}

class QuyenNghiPhepService {
  private readonly BASE_URL = '/quyennghiphep';

  async getAll(
    params?: QuyenNghiPhepParams,
  ): Promise<PaginatedResponse<QuyenNghiPhep>> {
    const response = await api.get<PaginatedResponse<QuyenNghiPhep>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<QuyenNghiPhep> {
    const response = await api.get<QuyenNghiPhep>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async getByNhanVienId(nhanVienId: string, nam?: number): Promise<LeaveBalance[]> {
    const response = await api.get<PaginatedResponse<QuyenNghiPhep>>(this.BASE_URL, {
      params: {nhan_vien_id: nhanVienId, nam, limit: 1000},
    });
    // Transform to LeaveBalance format
    const items = (response.data as any).data || [];
    return items.map((item: any) => ({
      loai_ngay_nghi: item.loai_ngay_nghi_id || {ten: '', mo_ta: ''},
      so_ngay_duoc_huong: item.so_ngay_duoc_huong || 0,
      so_ngay_da_su_dung: item.so_ngay_da_su_dung || 0,
      so_ngay_con_lai: (item.so_ngay_duoc_huong || 0) - (item.so_ngay_da_su_dung || 0),
    }));
  }

  async create(data: Partial<QuyenNghiPhep>): Promise<QuyenNghiPhep> {
    const response = await api.post<QuyenNghiPhep>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<QuyenNghiPhep>): Promise<QuyenNghiPhep> {
    const response = await api.put<QuyenNghiPhep>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new QuyenNghiPhepService();
