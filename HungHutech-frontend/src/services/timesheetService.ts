import api from './api';
import {Timesheet, PaginatedResponse, PaginationParams} from '@/types';

interface TimesheetParams extends PaginationParams {
  nhan_vien_id?: string;
  trang_thai?: 'Cho duyet' | 'Da duyet' | 'Bi tu choi';
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  tuan_bat_dau?: string;
}

interface ApproveTimesheetRequest {
  trang_thai: 'Da duyet' | 'Bi tu choi';
  ghi_chu?: string;
}

class TimesheetService {
  private readonly BASE_URL = '/timesheets';

  async getAll(
    params?: TimesheetParams,
  ): Promise<PaginatedResponse<Timesheet>> {
    const response = await api.get<PaginatedResponse<Timesheet>>(
      this.BASE_URL,
      {
        params,
      },
    );
    return response.data;
  }

  async getById(id: string): Promise<Timesheet> {
    const response = await api.get<Timesheet>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Timesheet>): Promise<Timesheet> {
    const response = await api.post<Timesheet>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Timesheet>): Promise<Timesheet> {
    const response = await api.put<Timesheet>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async updateStatus(
    id: string,
    data: {trang_thai: string},
  ): Promise<Timesheet> {
    const response = await api.put<Timesheet>(
      `${this.BASE_URL}/${id}/status`,
      data,
    );
    return response.data;
  }

  async approve(id: string, data: ApproveTimesheetRequest): Promise<Timesheet> {
    const response = await api.put<Timesheet>(
      `${this.BASE_URL}/${id}/approve`,
      data,
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new TimesheetService();
