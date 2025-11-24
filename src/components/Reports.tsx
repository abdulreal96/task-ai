import { useState } from 'react';
import { Task } from '../App';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

type ReportsProps = {
  tasks: Task[];
};

export function Reports({ tasks }: ReportsProps) {
  const [activeTab, setActiveTab] = useState('daily');

  // Daily Report Data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTasks = tasks.filter(t => {
    const taskDate = new Date(t.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });

  const dailyStats = {
    created: todayTasks.length,
    started: todayTasks.filter(t => t.status !== 'todo').length,
    completed: todayTasks.filter(t => t.status === 'completed').length,
    timeLogged: todayTasks.reduce((acc, t) => acc + t.timeLogged, 0)
  };

  // Weekly Report Data
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const weekTasks = tasks.filter(t => new Date(t.createdAt) >= weekAgo);

  const weeklyStats = {
    created: weekTasks.length,
    completed: weekTasks.filter(t => t.status === 'completed').length,
    timeLogged: weekTasks.reduce((acc, t) => acc + t.timeLogged, 0),
    productivity: weekTasks.length > 0 
      ? Math.round((weekTasks.filter(t => t.status === 'completed').length / weekTasks.length) * 100)
      : 0
  };

  // Status Distribution for Pie Chart
  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#9ca3af' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' }
  ];

  // Tag Distribution for Bar Chart
  const tagCounts: { [key: string]: number } = {};
  tasks.forEach(task => {
    task.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tagData = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Daily Trend Data (last 7 days)
  const dailyTrendData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayTasks = tasks.filter(t => {
      const taskDate = new Date(t.createdAt);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    dailyTrendData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      created: dayTasks.length,
      completed: dayTasks.filter(t => t.status === 'completed').length
    });
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl">Reports</h1>
        <p className="text-sm text-gray-500">Track your productivity</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 pt-4">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="mt-0 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{dailyStats.created}</p>
              <p className="text-sm text-gray-500">Tasks Created</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{dailyStats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{formatTime(dailyStats.timeLogged)}</p>
              <p className="text-sm text-gray-500">Time Logged</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{dailyStats.started}</p>
              <p className="text-sm text-gray-500">Tasks Started</p>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card className="p-4">
            <h3 className="mb-4">Task Status Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Top Tags */}
          <Card className="p-4">
            <h3 className="mb-4">Most Used Tags</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tagData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Weekly Report */}
        <TabsContent value="weekly" className="mt-0 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{weeklyStats.created}</p>
              <p className="text-sm text-gray-500">Tasks Created</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{weeklyStats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{formatTime(weeklyStats.timeLogged)}</p>
              <p className="text-sm text-gray-500">Total Time</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl mb-1">{weeklyStats.productivity}%</p>
              <p className="text-sm text-gray-500">Completion Rate</p>
            </Card>
          </div>

          {/* Daily Trend */}
          <Card className="p-4">
            <h3 className="mb-4">7-Day Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#3b82f6" name="Created" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Productivity Score */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h3 className="mb-2">Weekly Productivity Score</h3>
            <div className="flex items-end gap-2">
              <p className="text-4xl">{weeklyStats.productivity}</p>
              <p className="text-xl text-gray-600 mb-1">/100</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {weeklyStats.productivity >= 80 
                ? 'Excellent work! Keep it up!' 
                : weeklyStats.productivity >= 60 
                ? 'Good progress this week!' 
                : 'You can do better next week!'}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
