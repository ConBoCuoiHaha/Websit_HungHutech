import api from './api';
import {PaginatedResponse, ComplianceReportLog} from '@/types';

export interface ComplianceReportDefinition {
  id: string;
  name: string;
  description: string;
  frequency: string;
  fields: Array<{key: string; label: string}>;
}

export interface CompliancePreviewResponse {
  meta: {
    report: ComplianceReportDefinition;
    total: number;
    from_date?: string;
    to_date?: string;
  };
  data: Record<string, any>[];
}

export interface ComplianceReminder {
  report_id: string;
  report_name: string;
  period_key: string;
  due_date: string;
  days_left: number;
  lead_days: number;
  last_sent_at?: string | null;
  pending: boolean;
}

type CompliancePayload = {
  type: string;
  from_date?: string;
  to_date?: string;
  contributions?: Record<string, number>;
};

class ComplianceReportService {
  private readonly BASE_URL = '/compliance-reports';

  async getDefinitions(): Promise<ComplianceReportDefinition[]> {
    const response = await api.get<{data: ComplianceReportDefinition[]}>(
      `${this.BASE_URL}/definitions`,
    );
    return response.data.data || [];
  }

  async preview(
    payload: CompliancePayload,
  ): Promise<CompliancePreviewResponse> {
    const response = await api.post<CompliancePreviewResponse>(
      `${this.BASE_URL}/preview`,
      payload,
    );
    return response.data;
  }

  async exportCsv(payload: CompliancePayload): Promise<Blob> {
    const response = await api.post(`${this.BASE_URL}/export`, payload, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  async getReminders(): Promise<ComplianceReminder[]> {
    const response = await api.get<{data: ComplianceReminder[]}>(
      `${this.BASE_URL}/reminders`,
    );
    return response.data.data || [];
  }

  async markReminder(payload: {
    report_id: string;
    period_key: string;
    due_date?: string;
    note?: string;
  }): Promise<void> {
    await api.post(`${this.BASE_URL}/reminders/mark`, payload);
  }

  async getHistory(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<ComplianceReportLog>> {
    const response = await api.get<PaginatedResponse<ComplianceReportLog>>(
      `${this.BASE_URL}/history`,
      {params},
    );
    return response.data;
  }
}

export default new ComplianceReportService();
