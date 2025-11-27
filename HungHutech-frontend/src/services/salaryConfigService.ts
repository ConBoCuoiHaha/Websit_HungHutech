import api from '@/services/api';
import type {SalaryConfig} from '@/types';

class SalaryConfigService {
  private BASE_URL = '/salary-config';

  async get(): Promise<SalaryConfig> {
    const {data} = await api.get<SalaryConfig>(this.BASE_URL);
    return data;
  }

  async update(payload: Partial<SalaryConfig>): Promise<SalaryConfig> {
    const {data} = await api.put<SalaryConfig>(this.BASE_URL, payload);
    return data;
  }
}

export default new SalaryConfigService();
