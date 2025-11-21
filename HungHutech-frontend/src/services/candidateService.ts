import api from './api';
import {
  Candidate,
  CandidateQueryParams,
  PaginatedResponse,
} from '@/types';

class CandidateService {
  private readonly BASE_URL = '/recruitment/candidates';

  async getAll(
    params?: CandidateQueryParams,
  ): Promise<PaginatedResponse<Candidate>> {
    const response = await api.get<PaginatedResponse<Candidate>>(
      this.BASE_URL,
      {params},
    );
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

  async importResume(formData: FormData): Promise<Candidate> {
    const response = await api.post<Candidate>(
      `${this.BASE_URL}/import-resume`,
      formData,
      {
        headers: {'Content-Type': 'multipart/form-data'},
      },
    );
    return response.data;
  }

  async updatePipelineStage(
    id: string,
    payload: {stage: Candidate['pipeline_stage']; note?: string; score?: number},
  ): Promise<Candidate> {
    const response = await api.post<Candidate>(
      `${this.BASE_URL}/${id}/pipeline`,
      payload,
    );
    return response.data;
  }

  async searchPool(
    params?: CandidateQueryParams & {
      min_score?: number;
      min_exp?: number;
    },
  ): Promise<PaginatedResponse<Candidate>> {
    const response = await api.get<PaginatedResponse<Candidate>>(
      `${this.BASE_URL}/pool/search`,
      {params},
    );
    return response.data;
  }
}

export default new CandidateService();
