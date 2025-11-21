import api from './api';
import {
  PayrollRun,
  PayrollRunListResponse,
  PayrollRunStatus,
  PayrollEntry,
  PayrollMoneyItem,
  PayrollSettings,
  PayrollPayslip,
  PayrollPreviewResponse,
} from '@/types';

export interface PayrollRunQuery {
  page?: number;
  limit?: number;
  q?: string;
  trang_thai?: PayrollRunStatus | '';
  loai_ky?: 'Thang' | 'Tuan' | 'Tuy_chinh' | '';
}

export interface PayrollEntryPayload {
  nhan_vien_id: string;
  luong_co_ban: number;
  phu_cap?: PayrollMoneyItem[];
  thuong?: PayrollMoneyItem[];
  ot?: PayrollMoneyItem[];
  khoan_khau_tru?: PayrollMoneyItem[];
  so_nguoi_phu_thuoc?: number;
  trang_thai?: 'Cho_duyet' | 'Da_duyet' | 'Da_chi';
  ghi_chu?: string;
}

export interface CreatePayrollRunPayload {
  ky_luong: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  loai_ky?: 'Thang' | 'Tuan' | 'Tuy_chinh';
  currency?: string;
  ghi_chu?: string;
  settings?: Partial<PayrollSettings>;
  entries: PayrollEntryPayload[];
}

export interface PayrollPreviewPayload {
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  employee_ids?: string[];
}

class PayrollService {
  private readonly BASE_URL = '/payroll';

  async getRuns(params?: PayrollRunQuery): Promise<PayrollRunListResponse> {
    const response = await api.get<PayrollRunListResponse>(
      `${this.BASE_URL}/runs`,
      {
        params,
      },
    );
    return response.data;
  }

  async createRun(data: CreatePayrollRunPayload): Promise<PayrollRun> {
    const response = await api.post<PayrollRun>(`${this.BASE_URL}/runs`, data);
    return response.data;
  }

  async getRun(id: string): Promise<PayrollRun> {
    const response = await api.get<PayrollRun>(`${this.BASE_URL}/runs/${id}`);
    return response.data;
  }

  async updateRunStatus(
    id: string,
    trang_thai: PayrollRunStatus,
  ): Promise<PayrollRun> {
    const response = await api.patch<PayrollRun>(
      `${this.BASE_URL}/runs/${id}/status`,
      {
        trang_thai,
      },
    );
    return response.data;
  }

  async updateEntryStatus(
    runId: string,
    entryId: string,
    data: {trang_thai: 'Cho_duyet' | 'Da_duyet' | 'Da_chi'; ghi_chu?: string},
  ): Promise<PayrollEntry> {
    const response = await api.patch<PayrollEntry>(
      `${this.BASE_URL}/runs/${runId}/entries/${entryId}/status`,
      data,
    );
    return response.data;
  }

  async exportRun(id: string): Promise<Blob> {
    const response = await api.get(`${this.BASE_URL}/runs/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getMyPayslips(): Promise<PayrollPayslip[]> {
    const response = await api.get<{data: PayrollPayslip[]}>(
      `${this.BASE_URL}/my/payslips`,
    );
    return response.data?.data || [];
  }

  async preview(data: PayrollPreviewPayload): Promise<PayrollPreviewResponse> {
    const response = await api.post<PayrollPreviewResponse>(
      `${this.BASE_URL}/runs/preview`,
      data,
    );
    return response.data;
  }

  async exportTemplate(id: string, template: string): Promise<Blob> {
    const response = await api.get(
      `${this.BASE_URL}/runs/${id}/export-template/${template}`,
      {responseType: 'blob'},
    );
    return response.data;
  }
}

export default new PayrollService();
