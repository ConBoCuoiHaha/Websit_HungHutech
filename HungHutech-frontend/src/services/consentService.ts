import api from './api';
import {
  ConsentView,
  ConsentOverviewItem,
  ConsentAdminRow,
  PaginatedResponse,
} from '@/types';

export interface ConsentResponse {
  items: ConsentView[];
  pendingRequired: boolean;
}

class ConsentService {
  private readonly BASE_URL = '/consents';

  async getMyConsents(): Promise<ConsentResponse> {
    const response = await api.get<{
      data: ConsentView[];
      pending_required: boolean;
    }>(`${this.BASE_URL}/my`);
    return {
      items: response.data.data || [],
      pendingRequired: Boolean(response.data.pending_required),
    };
  }

  async getPurposes(): Promise<ConsentView[]> {
    const response = await api.get<{data: ConsentView[]}>(
      `${this.BASE_URL}/purposes`,
    );
    return response.data.data || [];
  }

  async saveConsents(
    consents: Array<{purpose: string; accepted: boolean; note?: string}>,
  ): Promise<ConsentResponse> {
    const response = await api.post<{
      data: ConsentView[];
      pending_required: boolean;
    }>(this.BASE_URL, {
      consents,
    });
    return {
      items: response.data.data || [],
      pendingRequired: Boolean(response.data.pending_required),
    };
  }

  async getOverview(): Promise<ConsentOverviewItem[]> {
    const response = await api.get<{data: ConsentOverviewItem[]; total_employees: number}>(
      `${this.BASE_URL}/overview`,
    );
    return response.data.data || [];
  }

  async getTracking(params?: {
    page?: number;
    limit?: number;
    phong_ban_id?: string;
    q?: string;
  }): Promise<PaginatedResponse<ConsentAdminRow>> {
    const response = await api.get<PaginatedResponse<ConsentAdminRow>>(
      `${this.BASE_URL}/tracking`,
      {params},
    );
    return response.data;
  }
}

export default new ConsentService();
