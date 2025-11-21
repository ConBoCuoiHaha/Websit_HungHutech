import api from './api';
import {
  DailyTimeSummary,
  PaginatedResponse,
  TimeRuleViolationStat,
} from '@/types';

export interface DailySummaryParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  nhan_vien_id?: string;
  phong_ban_id?: string;
  trang_thai?: string;
}

export interface RecalculatePayload {
  from_date: string;
  to_date?: string;
  nhan_vien_ids?: string[];
  phong_ban_id?: string;
}

class TimeRuleService {
  private readonly BASE_URL = '/time-rules';

  async getDailySummaries(
    params: DailySummaryParams,
  ): Promise<PaginatedResponse<DailyTimeSummary>> {
    const response = await api.get<PaginatedResponse<DailyTimeSummary>>(
      `${this.BASE_URL}/daily`,
      {params},
    );
    return response.data;
  }

  async getMySummaries(
    params: DailySummaryParams,
  ): Promise<PaginatedResponse<DailyTimeSummary>> {
    const response = await api.get<PaginatedResponse<DailyTimeSummary>>(
      `${this.BASE_URL}/my`,
      {params},
    );
    return response.data;
  }

  async recalculate(payload: RecalculatePayload): Promise<void> {
    await api.post(`${this.BASE_URL}/recalculate`, payload);
  }

  async getViolations(params: {
    from?: string;
    to?: string;
  }): Promise<TimeRuleViolationStat[]> {
    const response = await api.get<{data: TimeRuleViolationStat[]}>(
      `${this.BASE_URL}/violations`,
      {params},
    );
    return response.data.data || [];
  }
}

export default new TimeRuleService();
