import api from './api';
import {Project, PaginatedResponse, PaginationParams} from '@/types';

class ProjectService {
  private readonly BASE_URL = '/projects';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Project>> {
    const response = await api.get<PaginatedResponse<Project>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<Project> {
    const response = await api.get<Project>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Project>): Promise<Project> {
    const response = await api.post<Project>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put<Project>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ProjectService();
