import api from './api';
import {ChamCong, AttendanceSummary} from '@/types';

interface AttendanceHistoryParams {
  nhan_vien_id: string;
  from?: string;
  to?: string;
}

interface ClockInRequest {
  nhan_vien_id: string;
  ghi_chu?: string;
}

interface ClockOutRequest {
  nhan_vien_id: string;
  ghi_chu?: string;
}

class ChamCongService {
  private readonly BASE_URL = '/chamcong';

  async clockIn(data: ClockInRequest): Promise<ChamCong> {
    const response = await api.post<ChamCong>(`${this.BASE_URL}/clock-in`, data);
    return response.data;
  }

  async clockOut(data: ClockOutRequest): Promise<ChamCong> {
    const response = await api.post<ChamCong>(`${this.BASE_URL}/clock-out`, data);
    return response.data;
  }

  async getHistory(params: AttendanceHistoryParams): Promise<ChamCong[]> {
    const {nhan_vien_id, from, to} = params;
    const response = await api.get<ChamCong[]>(
      `${this.BASE_URL}/history/${nhan_vien_id}`,
      {
        params: {from, to},
      },
    );
    // API tra ve dang { data: ChamCong[], pagination: {...} }
    // Can tra ve mang ban ghi de phu hop voi UI
    // @ts-ignore
    return (response.data as any)?.data || [];
  }

  async update(id: string, data: Partial<ChamCong>): Promise<ChamCong> {
    const response = await api.put<ChamCong>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async getSummary(
    nhanVienId: string,
    from: string,
    to: string,
  ): Promise<AttendanceSummary> {
    const history = await this.getHistory({
      nhan_vien_id: nhanVienId,
      from,
      to,
    });

    const totalDays = this.calculateWorkDays(from, to);
    const presentDays = history.length;
    const absentDays = totalDays - presentDays;

    let lateDays = 0;
    let totalHours = 0;

    history.forEach((record) => {
      // Check if late (after 8:30 AM)
      const clockInTime = new Date(record.thoi_gian_vao);
      const lateThreshold = new Date(clockInTime);
      lateThreshold.setHours(8, 30, 0, 0);

      if (clockInTime > lateThreshold) {
        lateDays++;
      }

      // Calculate work hours
      if (record.thoi_gian_ra) {
        const clockIn = new Date(record.thoi_gian_vao);
        const clockOut = new Date(record.thoi_gian_ra);
        const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    return {
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      total_hours: Math.round(totalHours * 10) / 10,
    };
  }

  private calculateWorkDays(from: string, to: string): number {
    const start = new Date(from);
    const end = new Date(to);
    let count = 0;

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export default new ChamCongService();
