import { useState } from 'react';
import { Task } from '../App';
import { Clock, MoreVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

type TaskBoardProps = {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
};

export function TaskBoard({ tasks, onTaskClick, onUpdateTask }: TaskBoardProps) {
  const [activeTab, setActiveTab] = useState('all');

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const filterTasks = (status?: string) => {
    if (!status || status === 'all') return tasks;
    return tasks.filter(task => task.status === status);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      onClick={() => onTaskClick(task.id)}
      className="p-4 cursor-pointer hover:shadow-md transition-shadow mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="flex-1 pr-2">{task.title}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {task.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {task.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{task.tags.length - 3}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={`px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
        
        {task.timeLogged > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(task.timeLogged)}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-400 mt-2">
        Updated {formatRelativeTime(task.updatedAt)}
      </div>
    </Card>
  );

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const todoTasks = filterTasks('todo');
  const inProgressTasks = filterTasks('in-progress');
  const completedTasks = filterTasks('completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl">Tasks</h1>
        <p className="text-sm text-gray-500">{tasks.length} total tasks</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-4">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="all">
            All
            <span className="ml-1 text-xs">({tasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="todo">
            To Do
            <span className="ml-1 text-xs">({todoTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            Active
            <span className="ml-1 text-xs">({inProgressTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Done
            <span className="ml-1 text-xs">({completedTasks.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No tasks yet</p>
              <p className="text-sm">Create your first task using voice!</p>
            </div>
          ) : (
            <div>
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todo" className="mt-0">
          {todoTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No pending tasks</p>
            </div>
          ) : (
            <div>
              {todoTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="mt-0">
          {inProgressTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No tasks in progress</p>
            </div>
          ) : (
            <div>
              {inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No completed tasks yet</p>
            </div>
          ) : (
            <div>
              {completedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
