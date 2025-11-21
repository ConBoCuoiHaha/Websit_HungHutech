import api from './api';
import {PaginatedResponse} from '@/types';

export type DocumentFolder =
  | 'ho_so_lao_dong'
  | 'ho_so_bhxh'
  | 'ho_so_noi_bo'
  | 'ho_so_phap_ly';

export interface EmployeeDocument {
  _id: string;
  nhan_vien_id:
    | string
    | {
        _id: string;
        ma_nhan_vien?: string;
        ho_dem?: string;
        ten?: string;
      };
  folder: DocumentFolder;
  tieu_de: string;
  mo_ta?: string;
  file_url: string;
  ngay_hieu_luc?: string;
  ngay_het_han?: string;
  file_type?: string;
  file_size?: number;
  ngay_tao?: string;
}

export interface EmployeeDocumentParams {
  page?: number;
  limit?: number;
  q?: string;
  folder?: DocumentFolder;
  nhan_vien_id?: string;
}

class EmployeeDocumentService {
  private readonly BASE_URL = '/employee-documents';

  async getAll(
    params?: EmployeeDocumentParams,
  ): Promise<PaginatedResponse<EmployeeDocument>> {
    const response = await api.get<PaginatedResponse<EmployeeDocument>>(
      this.BASE_URL,
      {params},
    );
    return response.data;
  }

  async getMy(params?: {
    page?: number;
    limit?: number;
    folder?: DocumentFolder;
    q?: string;
  }): Promise<PaginatedResponse<EmployeeDocument>> {
    const response = await api.get<PaginatedResponse<EmployeeDocument>>(
      `${this.BASE_URL}/my`,
      {params},
    );
    return response.data;
  }

  async create(data: Partial<EmployeeDocument>): Promise<EmployeeDocument> {
    const response = await api.post<EmployeeDocument>(this.BASE_URL, data);
    return response.data;
  }

  async update(
    id: string,
    data: Partial<EmployeeDocument>,
  ): Promise<EmployeeDocument> {
    const response = await api.put<EmployeeDocument>(
      `${this.BASE_URL}/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new EmployeeDocumentService();
