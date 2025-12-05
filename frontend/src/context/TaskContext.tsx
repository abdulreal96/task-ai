import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { taskService, Task as ServiceTask } from '../services/taskService';
import { useAuth } from './AuthContext';

export type Task = Omit<ServiceTask, 'createdAt' | 'updatedAt' | 'dueDate' | 'activities' | 'timerStartedAt'> & {
  id: string; // Map _id to id for frontend compatibility
  createdAt?: Date;
  updatedAt?: Date;
  dueDate?: Date;
  timerStartedAt?: Date;
  activities?: Activity[];
};

export type Activity = {
  type: 'created' | 'status_changed' | 'timer_started' | 'timer_stopped' | 'updated';
  description: string;
  timestamp: Date;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  count: number;
};

interface TaskContextType {
  tasks: Task[];
  tags: Tag[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'activities'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: (taskId: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedTasks = await taskService.getAllTasks();
      
      // Map _id to id and ensure dates are Date objects
      const mappedTasks = fetchedTasks.map(t => ({
        ...t,
        id: t._id!,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
        timerStartedAt: t.timerStartedAt ? new Date(t.timerStartedAt) : undefined,
        activities: t.activities?.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        })) || []
      }));
      
      setTasks(mappedTasks);
      
      // Extract and count tags
      const tagCounts = new Map<string, number>();
      mappedTasks.forEach(task => {
        task.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];
      const mappedTags: Tag[] = Array.from(tagCounts.entries()).map(([name, count], index) => ({
        id: `tag-${name}`,
        name,
        color: colors[index % colors.length],
        count
      }));
      
      setTags(mappedTags);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: Omit<Task, 'id' | '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'activities'>) => {
    try {
      // Convert Date objects to ISO strings for API
      const apiData = {
        ...taskData,
        dueDate: taskData.dueDate instanceof Date ? taskData.dueDate.toISOString() : taskData.dueDate,
        timerStartedAt: taskData.timerStartedAt instanceof Date ? taskData.timerStartedAt.toISOString() : taskData.timerStartedAt,
      };
      await taskService.createTask(apiData as any);
      await fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Auto-stop timer when status changes away from 'in-progress'
      const currentTask = tasks.find(t => t.id === taskId);
      if (currentTask && updates.status && updates.status !== 'in-progress' && currentTask.timerStatus === 'running') {
        console.log('Auto-stopping timer due to status change');
        updates.timerStatus = 'stopped';
      }

      // Optimistic update
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ));

      // Remove id from updates if present, as it's not part of the service payload
      // Also remove Date objects and activities - backend handles these
      const { id, activities, createdAt, updatedAt, timerStartedAt, ...serviceUpdates } = updates;
      console.log('Updating task:', taskId, serviceUpdates);
      await taskService.updateTask(taskId, serviceUpdates as any);
      
      // Refresh to ensure sync
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // Revert optimistic update on error
      await fetchTasks();
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const startTimer = async (taskId: string) => {
    try {
      await updateTask(taskId, {
        timerStatus: 'running'
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  };

  const stopTimer = async (taskId: string) => {
    try {
      await updateTask(taskId, {
        timerStatus: 'paused'
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      tags, 
      loading,
      addTask, 
      updateTask, 
      deleteTask,
      refreshTasks: fetchTasks,
      startTimer,
      stopTimer
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
