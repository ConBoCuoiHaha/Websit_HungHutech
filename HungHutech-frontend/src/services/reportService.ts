import api from './api';
import {
  Report,
  GenerateReportRequest,
  GenerateReportResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

class ReportService {
  private readonly BASE_URL = '/reports';

  async getAll(params?: PaginationParams & { loai_bao_cao?: string }): Promise<PaginatedResponse<Report>> {
    const response = await api.get<PaginatedResponse<Report>>(this.BASE_URL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<Report> {
    const response = await api.get<Report>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Report>): Promise<Report> {
    const response = await api.post<Report>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Report>): Promise<Report> {
    const response = await api.put<Report>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async generate(data: GenerateReportRequest): Promise<GenerateReportResponse> {
    const response = await api.post<GenerateReportResponse>(`${this.BASE_URL}/generate`, data);
    return response.data;
  }

  getExportUrl(id: string): string {
    const token = localStorage.getItem('token');
    return `http://localhost:5000/api${this.BASE_URL}/export/${id}?token=${token}`;
  }

  downloadExport(id: string): void {
    const url = this.getExportUrl(id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default new ReportService();
