import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Task = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: Date;
  timeLogged: number;
  createdAt: Date;
  updatedAt: Date;
  activities: Activity[];
};

export type Activity = {
  id: string;
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

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Implement wallet balance functionality',
    description: 'Add wallet balance feature to transporter module',
    tags: ['wallet', 'transporter', 'implement'],
    status: 'in-progress',
    dueDate: new Date(2025, 10, 28, 17, 0),
    timeLogged: 120,
    createdAt: new Date(2025, 10, 22, 9, 30),
    updatedAt: new Date(2025, 10, 22, 11, 30),
    activities: [
      { id: 'a1', type: 'created', description: 'Task created via voice', timestamp: new Date(2025, 10, 22, 9, 30) },
      { id: 'a2', type: 'status_changed', description: 'Status changed to In Progress', timestamp: new Date(2025, 10, 22, 10, 0) },
      { id: 'a3', type: 'timer_started', description: 'Timer started', timestamp: new Date(2025, 10, 22, 10, 0) }
    ]
  },
  {
    id: '2',
    title: 'Fix authentication bug',
    description: 'Debug login issue on mobile devices',
    tags: ['bug', 'authentication', 'fix'],
    status: 'completed',
    dueDate: new Date(2025, 10, 25, 17, 0),
    timeLogged: 45,
    createdAt: new Date(2025, 10, 21, 14, 0),
    updatedAt: new Date(2025, 10, 21, 14, 45),
    activities: [
      { id: 'a4', type: 'created', description: 'Task created via voice', timestamp: new Date(2025, 10, 21, 14, 0) },
      { id: 'a5', type: 'status_changed', description: 'Status changed to Completed', timestamp: new Date(2025, 10, 21, 14, 45) }
    ]
  },
  {
    id: '3',
    title: 'Design user dashboard',
    description: 'Create mockups for new dashboard layout',
    tags: ['design', 'dashboard', 'ui'],
    status: 'todo',
    dueDate: new Date(2025, 10, 30, 17, 0),
    timeLogged: 0,
    createdAt: new Date(2025, 10, 22, 8, 0),
    updatedAt: new Date(2025, 10, 22, 8, 0),
    activities: [
      { id: 'a6', type: 'created', description: 'Task created via voice', timestamp: new Date(2025, 10, 22, 8, 0) }
    ]
  }
];

const initialTags: Tag[] = [
  { id: 't1', name: 'wallet', color: '#10b981', count: 1 },
  { id: 't2', name: 'transporter', color: '#3b82f6', count: 1 },
  { id: 't3', name: 'implement', color: '#8b5cf6', count: 1 },
  { id: 't4', name: 'bug', color: '#ef4444', count: 1 },
  { id: 't5', name: 'authentication', color: '#f59e0b', count: 1 },
  { id: 't6', name: 'fix', color: '#ec4899', count: 1 },
  { id: 't7', name: 'design', color: '#06b6d4', count: 1 },
  { id: 't8', name: 'dashboard', color: '#84cc16', count: 1 },
  { id: 't9', name: 'ui', color: '#6366f1', count: 1 }
];

interface TaskContextType {
  tasks: Task[];
  tags: Tag[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tags, setTags] = useState<Tag[]>(initialTags);

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const task: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setTasks([task, ...tasks]);
    
    // Update tag counts
    task.tags.forEach((tagName: string) => {
      const existingTag = tags.find((t: Tag) => t.name === tagName);
      if (existingTag) {
        setTags(tags.map((t: Tag) => t.id === existingTag.id ? { ...t, count: t.count + 1 } : t));
      } else {
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];
        const newTag: Tag = {
          id: `t${Date.now()}`,
          name: tagName,
          color: colors[Math.floor(Math.random() * colors.length)],
          count: 1
        };
        setTags([...tags, newTag]);
      }
    });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map((task: Task) => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    ));
  };

  const deleteTask = (taskId: string) => {
    const task = tasks.find((t: Task) => t.id === taskId);
    if (task) {
      task.tags.forEach((tagName: string) => {
        const tag = tags.find((t: Tag) => t.name === tagName);
        if (tag) {
          setTags(tags.map((t: Tag) => t.id === tag.id ? { ...t, count: Math.max(0, t.count - 1) } : t));
        }
      });
    }
    setTasks(tasks.filter((task: Task) => task.id !== taskId));
  };

  return (
    <TaskContext.Provider value={{ tasks, tags, addTask, updateTask, deleteTask }}>
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
