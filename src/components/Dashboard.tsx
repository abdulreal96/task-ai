import { Task } from '../App';
import { Mic, ListTodo, BarChart3, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

type DashboardProps = {
  tasks: Task[];
  onNavigate: (screen: string) => void;
  onTaskClick: (taskId: string) => void;
};

export function Dashboard({ tasks, onNavigate, onTaskClick }: DashboardProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTasks = tasks.filter(t => {
    const taskDate = new Date(t.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const totalTimeToday = todayTasks.reduce((acc, t) => acc + t.timeLogged, 0);
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-3xl mb-2">Hello, Abdulwahab 👋</h1>
        <p className="text-blue-100">Let's make today productive</p>
      </div>

      {/* Stats Cards */}
      <div className="px-6 -mt-6 space-y-3 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-white shadow-md">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <ListTodo className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl">{todayTasks.length}</p>
              <p className="text-xs text-gray-500 text-center">Created Today</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl">{completedToday}</p>
              <p className="text-xs text-gray-500 text-center">Completed</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-md">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl">{formatTime(totalTimeToday)}</p>
              <p className="text-xs text-gray-500 text-center">Logged</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => onNavigate('record')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Mic className="w-8 h-8" />
            <span>Record Task</span>
          </Button>
          
          <Button 
            onClick={() => onNavigate('tasks')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <ListTodo className="w-8 h-8" />
            <span>View Tasks</span>
          </Button>
          
          <Button 
            onClick={() => onNavigate('reports')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <BarChart3 className="w-8 h-8" />
            <span>Reports</span>
          </Button>
          
          <Button 
            onClick={() => onNavigate('tags')}
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
          >
            <TrendingUp className="w-8 h-8" />
            <span>Tags</span>
          </Button>
        </div>
      </div>

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg mb-3">In Progress</h2>
          <div className="space-y-2">
            {inProgressTasks.map(task => (
              <Card 
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="mb-2">{task.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {task.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.timeLogged > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {formatTime(task.timeLogged)}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      <div className="px-6 mb-6">
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="mb-1">AI Suggestion</h3>
              <p className="text-sm text-gray-600">
                You have {tasks.filter(t => t.status === 'todo').length} pending tasks. 
                Consider starting with high-priority items to stay on track.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
