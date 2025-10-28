import api from './api';
import {PaginatedResponse, PaginationParams} from '@/types';

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'employee';
  employee_id?: string | any;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class UserService {
  private readonly BASE_URL = '/users';

  async getAll(params?: PaginationParams & {role?: string}): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<User> & {password: string}): Promise<User> {
    const response = await api.post<User>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put<User>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    await api.put(`${this.BASE_URL}/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
  }
}

export default new UserService();
