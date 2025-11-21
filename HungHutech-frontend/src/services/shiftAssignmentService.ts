import api from './api';
import {PaginatedResponse, ShiftAssignment} from '@/types';

class ShiftAssignmentService {
  private readonly BASE_URL = '/shift-assignments';

  async getAll(params?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    nhan_vien_id?: string;
  }): Promise<PaginatedResponse<ShiftAssignment>> {
    const response = await api.get<PaginatedResponse<ShiftAssignment>>(
      this.BASE_URL,
      {params},
    );
    return response.data;
  }

  async bulkAssign(payload: {
    nhan_vien_ids: string[];
    ca_lam_viec_id: string;
    from_date: string;
    to_date?: string;
    ghi_chu?: string;
  }): Promise<void> {
    await api.post(this.BASE_URL, payload);
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}

export default new ShiftAssignmentService();
