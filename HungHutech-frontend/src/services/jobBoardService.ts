import api from './api';

export interface JobBoardChannel {
  key: string;
  name: string;
  description?: string;
}

class JobBoardService {
  private readonly BASE_URL = '/recruitment/vacancies';

  async getChannels(): Promise<JobBoardChannel[]> {
    const response = await api.get<{data: JobBoardChannel[]}>(
      `${this.BASE_URL}/channels/list`,
    );
    return response.data.data || [];
  }

  async publishVacancy(
    id: string,
    payload: {channels: string[]},
  ): Promise<void> {
    await api.post(`${this.BASE_URL}/${id}/publish`, payload);
  }
}

export default new JobBoardService();
