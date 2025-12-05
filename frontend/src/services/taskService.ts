import api from './api';

export interface Task {
  _id?: string;
  userId?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date | string;
  timeSpent: number;
  timerStatus?: 'stopped' | 'running' | 'paused';
  timerStartedAt?: string;
  activities?: any[];
  voiceTranscription?: string;
  aiGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const taskService = {
  async getAllTasks(): Promise<Task[]> {
    const response = await api.get('/tasks');
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(task: Omit<Task, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    // Convert Date objects to ISO strings for the API
    const payload = {
      ...updates,
      dueDate: updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate,
    };
    const response = await api.patch(`/tasks/${id}`, payload);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getTasksByStatus(status: string): Promise<Task[]> {
    const response = await api.get(`/tasks/status/${status}`);
    return response.data;
  },

};
