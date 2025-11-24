import { Task, Tag } from '../App';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

type TagsScreenProps = {
  tags: Tag[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
};

export function TagsScreen({ tags, tasks, onTaskClick }: TagsScreenProps) {
  const getTasksForTag = (tagName: string) => {
    return tasks.filter(task => task.tags.includes(tagName));
  };

  const sortedTags = [...tags].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl">Tags</h1>
        <p className="text-sm text-gray-500">{tags.length} tags</p>
      </div>

      {/* Tags Grid */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-3 mb-8">
          {sortedTags.map(tag => (
            <Card 
              key={tag.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderLeftWidth: '4px', borderLeftColor: tag.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  className="text-sm"
                >
                  {tag.name}
                </Badge>
              </div>
              <p className="text-2xl mb-1">{tag.count}</p>
              <p className="text-xs text-gray-500">
                {tag.count === 1 ? 'task' : 'tasks'}
              </p>
            </Card>
          ))}
        </div>

        {/* Tag Details */}
        {sortedTags.map(tag => {
          const tagTasks = getTasksForTag(tag.name);
          if (tagTasks.length === 0) return null;

          return (
            <div key={tag.id} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge 
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </Badge>
                <span className="text-sm text-gray-500">({tagTasks.length})</span>
              </div>

              <div className="space-y-2">
                {tagTasks.map(task => (
                  <Card
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-sm mb-2">{task.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'in-progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'To Do'}
                      </span>
                      {task.timeLogged > 0 && (
                        <span className="text-xs text-gray-500">
                          {Math.floor(task.timeLogged / 60)}h {task.timeLogged % 60}m
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
