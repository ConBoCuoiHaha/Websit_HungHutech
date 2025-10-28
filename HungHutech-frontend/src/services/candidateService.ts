import api from './api';
import {Candidate, PaginatedResponse, PaginationParams} from '@/types';

class CandidateService {
  private readonly BASE_URL = '/recruitment/candidates';

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Candidate>> {
    const response = await api.get<PaginatedResponse<Candidate>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<Candidate> {
    const response = await api.get<Candidate>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Candidate>): Promise<Candidate> {
    const response = await api.post<Candidate>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Candidate>): Promise<Candidate> {
    const response = await api.put<Candidate>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new CandidateService();
