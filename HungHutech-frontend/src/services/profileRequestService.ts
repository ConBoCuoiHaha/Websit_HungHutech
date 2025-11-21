import api from './api';
import {PaginatedResponse, ProfileRequest, ProfileRequestType} from '@/types';

export interface ProfileRequestListParams {
  page?: number;
  limit?: number;
  status?: ProfileRequest['status'];
  type?: ProfileRequestType;
  nhan_vien_id?: string;
  q?: string;
}

class ProfileRequestService {
  private readonly BASE_URL = '/profile-requests';

  async create(data: {type: ProfileRequestType; payload: any; note?: string}) {
    const response = await api.post<ProfileRequest>(this.BASE_URL, data);
    return response.data;
  }

  async getMy(): Promise<ProfileRequest[]> {
    const response = await api.get<{data: ProfileRequest[]}>(
      `${this.BASE_URL}/my`,
    );
    return response.data?.data || [];
  }

  async list(
    params?: ProfileRequestListParams,
  ): Promise<PaginatedResponse<ProfileRequest>> {
    const response = await api.get<{
      data: ProfileRequest[];
      pagination?: {total: number; page: number; limit: number};
    }>(this.BASE_URL, {params});
    const pagination = response.data.pagination || {
      total: 0,
      page: 1,
      limit: params?.limit || 20,
    };
    return {
      items: response.data.data || [],
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || params?.limit || 20,
    };
  }

  async updateStatus(
    id: string,
    data: {
      status: Exclude<ProfileRequest['status'], 'Pending'>;
      approver_note?: string;
    },
  ): Promise<ProfileRequest> {
    const response = await api.patch<ProfileRequest>(
      `${this.BASE_URL}/${id}/status`,
      data,
    );
    return response.data;
  }
}

export default new ProfileRequestService();
