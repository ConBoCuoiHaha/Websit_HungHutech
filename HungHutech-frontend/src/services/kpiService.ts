import api from './api';
import {KPI, PaginatedResponse, PaginationParams} from '@/types';

class KPIService {
  private readonly BASE_URL = '/performance/kpis';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<KPI>> {
    const response = await api.get<PaginatedResponse<KPI>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<KPI> {
    const response = await api.get<KPI>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<KPI>): Promise<KPI> {
    const response = await api.post<KPI>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<KPI>): Promise<KPI> {
    const response = await api.put<KPI>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new KPIService();
