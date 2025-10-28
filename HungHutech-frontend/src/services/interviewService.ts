import api from './api';
import { Interview, PaginatedResponse, PaginationParams, InterviewSchedule } from '@/types';

interface InterviewFilterParams extends PaginationParams {
  ung_vien_id?: string;
  vi_tri_tuyen_dung_id?: string;
  trang_thai?: string;
  loai_phong_van?: string;
  tu_ngay?: string;
  den_ngay?: string;
  nguoi_phong_van_id?: string;
}

interface ScheduleParams {
  nguoi_phong_van_id: string;
  tu_ngay?: string;
  den_ngay?: string;
  view?: 'week' | 'month' | 'day';
}

class InterviewService {
  private readonly BASE_URL = '/recruitment/interviews';

  // Lấy tất cả lịch phỏng vấn với filter
  async getAll(params?: InterviewFilterParams): Promise<PaginatedResponse<Interview>> {
    const response = await api.get<PaginatedResponse<Interview>>(this.BASE_URL, { params });
    return response.data;
  }

  // Lấy lịch phỏng vấn theo ID
  async getById(id: string): Promise<Interview> {
    const response = await api.get<Interview>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  // Tạo lịch phỏng vấn mới
  async create(data: Partial<Interview>): Promise<Interview> {
    const response = await api.post<Interview>(this.BASE_URL, data);
    return response.data;
  }

  // Cập nhật lịch phỏng vấn
  async update(id: string, data: Partial<Interview>): Promise<Interview> {
    const response = await api.put<Interview>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  // Xóa lịch phỏng vấn (soft delete)
  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  // Cập nhật kết quả phỏng vấn
  async updateResult(id: string, ket_qua_phong_van: any): Promise<Interview> {
    const response = await api.put<Interview>(`${this.BASE_URL}/${id}/result`, {
      ket_qua_phong_van,
    });
    return response.data;
  }

  // Xác nhận lịch phỏng vấn
  async confirm(id: string): Promise<Interview> {
    const response = await api.patch<Interview>(`${this.BASE_URL}/${id}/confirm`);
    return response.data;
  }

  // Hủy lịch phỏng vấn
  async cancel(id: string, ly_do?: string): Promise<Interview> {
    const response = await api.patch<Interview>(`${this.BASE_URL}/${id}/cancel`, { ly_do });
    return response.data;
  }

  // Lấy lịch phỏng vấn theo ngày/tuần cho interviewer
  async getSchedule(params: ScheduleParams): Promise<InterviewSchedule> {
    const response = await api.get<InterviewSchedule>(`${this.BASE_URL}/schedule`, { params });
    return response.data;
  }
}

export default new InterviewService();
