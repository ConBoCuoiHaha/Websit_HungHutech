import api from './api';
import {DashboardSummary} from '@/types';

class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>('/dashboard/summary');
    return response.data;
  }
}

export default new DashboardService();
