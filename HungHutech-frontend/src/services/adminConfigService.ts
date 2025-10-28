import axios from 'axios';
import type {
  EmploymentStatus,
  JobCategory,
  Nationality,
  Skill,
  EducationLevel,
  Language,
  PaginatedResponse,
  PaginationParams
} from '@/types';

const API_BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000/api';

// Generic service class cho tất cả admin config entities
class AdminConfigService<T> {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = `${API_BASE}/admin/${endpoint}`;
  }

  async getAll(params?: PaginationParams & { search?: string; kich_hoat?: boolean }): Promise<PaginatedResponse<T>> {
    const response = await axios.get(this.endpoint, { params });
    return response.data;
  }

  async getById(id: string): Promise<T> {
    const response = await axios.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await axios.post(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await axios.put(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await axios.delete(`${this.endpoint}/${id}`);
  }

  async toggleActive(id: string): Promise<T> {
    const response = await axios.patch(`${this.endpoint}/${id}/toggle-active`);
    return response.data;
  }
}

// Export service instances cho từng entity
export const employmentStatusService = new AdminConfigService<EmploymentStatus>('employment-statuses');
export const jobCategoryService = new AdminConfigService<JobCategory>('job-categories');
export const nationalityService = new AdminConfigService<Nationality>('nationalities');
export const skillService = new AdminConfigService<Skill>('skills');
export const educationLevelService = new AdminConfigService<EducationLevel>('education-levels');
export const languageService = new AdminConfigService<Language>('languages');

export default {
  employmentStatus: employmentStatusService,
  jobCategory: jobCategoryService,
  nationality: nationalityService,
  skill: skillService,
  educationLevel: educationLevelService,
  language: languageService
};
