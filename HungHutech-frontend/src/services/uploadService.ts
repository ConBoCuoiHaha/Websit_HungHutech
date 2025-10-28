import api from './api';

class UploadService {
  async uploadEmployeePhoto(employeeId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/upload/nhanvien/${employeeId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async listFiles(ownerType: string, ownerId: string): Promise<any[]> {
    const response = await api.get('/upload/files', {
      params: {
        owner_type: ownerType,
        owner_id: ownerId,
      },
    });
    return response.data;
  }

  async deleteFile(fileId: string): Promise<void> {
    await api.delete(`/upload/files/${fileId}`);
  }

  getFileUrl(filePath: string): string {
    // Remove '/uploads/' prefix if present to avoid duplication
    const cleanPath = filePath.replace(/^\/uploads\//, '').replace(/^uploads[\/\\]/, '');
    const baseUrl = 'http://localhost:5000';
    return `${baseUrl}/uploads/${cleanPath}`;
  }
}

export default new UploadService();
