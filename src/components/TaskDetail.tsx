import { useState } from 'react';
import { Task, Tag } from '../App';
import { ArrowLeft, Clock, Play, Square, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

type TaskDetailProps = {
  task: Task;
  onBack: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  tags: Tag[];
};

export function TaskDetail({ task, onBack, onUpdate, onDelete, tags }: TaskDetailProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (newStatus: 'todo' | 'in-progress' | 'completed') => {
    const activity = {
      id: `a${Date.now()}`,
      type: 'status_changed' as const,
      description: `Status changed to ${getStatusLabel(newStatus)}`,
      timestamp: new Date()
    };
    
    onUpdate({
      status: newStatus,
      activities: [...task.activities, activity]
    });
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      // Stop timer
      const activity = {
        id: `a${Date.now()}`,
        type: 'timer_stopped' as const,
        description: `Timer stopped - ${currentSessionTime} minutes logged`,
        timestamp: new Date()
      };
      
      onUpdate({
        timeLogged: task.timeLogged + currentSessionTime,
        activities: [...task.activities, activity]
      });
      
      setCurrentSessionTime(0);
    } else {
      // Start timer
      const activity = {
        id: `a${Date.now()}`,
        type: 'timer_started' as const,
        description: 'Timer started',
        timestamp: new Date()
      };
      
      onUpdate({
        activities: [...task.activities, activity]
      });
      
      // Simulate timer (in real app, this would use setInterval)
      setTimeout(() => {
        setCurrentSessionTime(5); // Mock 5 minutes
      }, 1000);
    }
    
    setIsTimerRunning(!isTimerRunning);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'timer_started':
      case 'timer_stopped':
        return <Clock className="w-4 h-4" />;
      default:
        return <Edit2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg flex-1">Task Details</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-600">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl mb-2">{task.title}</h2>
          <p className="text-sm text-gray-500">{task.description}</p>
        </div>

        {/* Status */}
        <Card className="p-4">
          <label className="text-sm text-gray-500 block mb-2">Status</label>
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Tags */}
        <Card className="p-4">
          <label className="text-sm text-gray-500 block mb-3">Tags</label>
          <div className="flex flex-wrap gap-2">
            {task.tags.map(tagName => {
              const tagInfo = tags.find(t => t.name === tagName);
              return (
                <Badge 
                  key={tagName}
                  style={{ backgroundColor: tagInfo?.color + '20', color: tagInfo?.color }}
                >
                  {tagName}
                </Badge>
              );
            })}
          </div>
        </Card>

        {/* Timer */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm text-gray-500 block">Time Logged</label>
              <p className="text-2xl">{formatTime(task.timeLogged + currentSessionTime)}</p>
            </div>
            <Button
              onClick={toggleTimer}
              size="lg"
              className={isTimerRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isTimerRunning ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
          {isTimerRunning && (
            <div className="text-sm text-gray-500">
              Timer running... ({currentSessionTime}m this session)
            </div>
          )}
        </Card>

        {/* Activity History */}
        <Card className="p-4">
          <h3 className="mb-4">Activity History</h3>
          <div className="space-y-4">
            {task.activities.slice().reverse().map(activity => (
              <div key={activity.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Metadata */}
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-500 block">Created</label>
              <p>{formatTimestamp(task.createdAt)}</p>
            </div>
            <div>
              <label className="text-gray-500 block">Last Updated</label>
              <p>{formatTimestamp(task.updatedAt)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
