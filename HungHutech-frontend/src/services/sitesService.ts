import api from './api';

export interface Site {
  _id?: string;
  siteId: string;
  name: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  longitude?: number;
  latitude?: number;
  radius: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedSites {
  data: Site[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class SitesService {
  private readonly BASE_URL = '/sites';

  async getAll(params?: any): Promise<PaginatedSites> {
    const response = await api.get<PaginatedSites>(this.BASE_URL, {params});
    return response.data;
  }

  async getById(id: string): Promise<Site> {
    const response = await api.get<Site>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  async create(data: Partial<Site>): Promise<Site> {
    const response = await api.post<Site>(this.BASE_URL, data);
    return response.data;
  }

  async update(id: string, data: Partial<Site>): Promise<Site> {
    const response = await api.put<Site>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }

  async toggle(id: string): Promise<{msg: string; isActive: boolean}> {
    const response = await api.patch<{msg: string; isActive: boolean}>(
      `${this.BASE_URL}/${id}/toggle`,
    );
    return response.data;
  }

  async getNearby(
    longitude: number,
    latitude: number,
    maxDistance?: number,
  ): Promise<{data: Site[]; total: number}> {
    const response = await api.get<{data: Site[]; total: number}>(
      `${this.BASE_URL}/nearby`,
      {
        params: {longitude, latitude, maxDistance},
      },
    );
    return response.data;
  }
}

export default new SitesService();
