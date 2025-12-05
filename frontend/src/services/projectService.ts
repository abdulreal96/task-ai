import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
}

export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get('/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Get projects error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getProject(projectId: string): Promise<Project> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.get(`/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Get project error:', error.response?.data || error.message);
      throw error;
    }
  },

  async createProject(projectData: CreateProjectDto): Promise<Project> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await api.post('/projects', projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Create project error:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteProject(projectId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await api.delete(`/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Delete project error:', error.response?.data || error.message);
      throw error;
    }
  },
};
