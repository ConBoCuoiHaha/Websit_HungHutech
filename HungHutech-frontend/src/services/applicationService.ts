import api from './api';
import {Application, PaginatedResponse, PaginationParams} from '@/types';

class ApplicationService {
  private readonly BASE_URL = '/recruitment/applications';

  async getAll(params?: PaginationParams & {vacancy_id?: string; candidate_id?: string}): Promise<PaginatedResponse<Application>> {
    const response = await api.get<PaginatedResponse<Application>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<Application> {
    const response = await api.get<Application>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Application>): Promise<Application> {
    const response = await api.post<Application>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Application>): Promise<Application> {
    const response = await api.put<Application>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    trang_thai: 'Ung tuyen' | 'So tuyen' | 'Phong van' | 'Tuyen dung' | 'Tu choi',
    ghi_chu?: string,
  ): Promise<Application> {
    const response = await api.put<Application>(`${this.BASE_URL}/${id}`, {
      trang_thai,
      ghi_chu,
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ApplicationService();
