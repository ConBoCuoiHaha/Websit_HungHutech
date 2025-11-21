import api from './api';
import {Activity, PaginatedResponse, PaginationParams} from '@/types';

interface ActivityParams extends PaginationParams {
  project_id?: string;
}

class ActivityService {
  private readonly BASE_URL = '/activities';

  async getAll(params?: ActivityParams): Promise<PaginatedResponse<Activity>> {
    const response = await api.get<PaginatedResponse<Activity>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<Activity> {
    const response = await api.get<Activity>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Activity>): Promise<Activity> {
    const response = await api.post<Activity>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    const response = await api.put<Activity>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ActivityService();
