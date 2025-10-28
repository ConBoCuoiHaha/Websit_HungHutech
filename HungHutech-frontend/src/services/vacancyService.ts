import api from './api';
import {Vacancy, PaginatedResponse, PaginationParams} from '@/types';

class VacancyService {
  private readonly BASE_URL = '/recruitment/vacancies';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Vacancy>> {
    const response = await api.get<PaginatedResponse<Vacancy>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<Vacancy> {
    const response = await api.get<Vacancy>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await api.post<Vacancy>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await api.put<Vacancy>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new VacancyService();
