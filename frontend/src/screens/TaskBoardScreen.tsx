import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MoreVertical, Edit3, Trash2, PlayCircle, Calendar, Copy } from 'lucide-react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

export default function TaskBoardScreen() {
  const { tasks, updateTask, deleteTask } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

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
        return { bg: '#f3f4f6', text: '#374151' };
      case 'in-progress':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
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

  const formatDueDate = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if overdue
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    }
    
    // Check if today
    if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    }
    
    // Check if tomorrow
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isSoon: true };
    }
    
    // Within a week
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays}d`, isSoon: true };
    }
    
    // Format date
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return { text: `Due ${due.toLocaleDateString('en-US', options)}`, isNormal: true };
  };

  const handleTaskAction = (taskId: string, action: string) => {
    setShowActionMenu(false);
    setSelectedTask(null);
    
    switch (action) {
      case 'edit':
        // Navigate to edit screen (to be implemented)
        console.log('Edit task:', taskId);
        break;
      case 'changeStatus':
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const statusOrder = ['todo', 'in-progress', 'completed'];
          const currentIndex = statusOrder.indexOf(task.status);
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length] as 'todo' | 'in-progress' | 'completed';
          updateTask(taskId, { status: nextStatus });
        }
        break;
      case 'delete':
        deleteTask(taskId);
        break;
      case 'timer':
        // Start/stop timer (to be implemented)
        console.log('Toggle timer:', taskId);
        break;
      case 'duplicate':
        // Duplicate task (to be implemented)
        console.log('Duplicate task:', taskId);
        break;
      default:
        break;
    }
  };

  const filterTasks = () => {
    if (activeTab === 'all') return tasks;
    return tasks.filter(task => task.status === activeTab);
  };

  const filteredTasks = filterTasks();
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const tabs = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'todo', label: 'To Do', count: todoTasks.length },
    { key: 'in-progress', label: 'Active', count: inProgressTasks.length },
    { key: 'completed', label: 'Done', count: completedTasks.length },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{tasks.length} total tasks</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsList}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { backgroundColor: activeTab === tab.key ? colors.primary : colors.background }, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.key ? '#ffffff' : colors.textSecondary }, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              <Text style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
                ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tasks List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No tasks {activeTab !== 'all' ? `in ${getStatusLabel(activeTab)}` : 'yet'}
            </Text>
            <Text style={styles.emptySubtext}>Create your first task using voice!</Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => {
                    setSelectedTask(task.id);
                    setShowActionMenu(true);
                  }}
                >
                  <MoreVertical size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {task.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={[styles.taskTag, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
                    <Text style={[styles.taskTagText, { color: isDarkMode ? '#93c5fd' : '#1e40af' }]}>{tag}</Text>
                  </View>
                ))}
                {task.tags.length > 3 && (
                  <View style={[styles.taskTag, styles.taskTagMore]}>
                    <Text style={styles.taskTagMoreText}>+{task.tags.length - 3}</Text>
                  </View>
                )}
              </View>

              {/* Due Date */}
              {formatDueDate(task.dueDate) && (
                <View style={styles.dueDateContainer}>
                  <Calendar size={12} color={
                    formatDueDate(task.dueDate)?.isOverdue ? '#ef4444' : 
                    formatDueDate(task.dueDate)?.isToday ? '#f59e0b' : 
                    formatDueDate(task.dueDate)?.isSoon ? '#3b82f6' : 
                    colors.textSecondary
                  } />
                  <Text style={[
                    styles.dueDateText,
                    { color: formatDueDate(task.dueDate)?.isOverdue ? '#ef4444' : 
                      formatDueDate(task.dueDate)?.isToday ? '#f59e0b' : 
                      formatDueDate(task.dueDate)?.isSoon ? '#3b82f6' : 
                      colors.textSecondary 
                    }
                  ]}>
                    {formatDueDate(task.dueDate)?.text}
                  </Text>
                </View>
              )}

              {/* Footer */}
              <View style={styles.taskFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(task.status).text }]}>
                    {getStatusLabel(task.status)}
                  </Text>
                </View>

                {task.timeLogged > 0 && (
                  <View style={styles.timeContainer}>
                    <Clock size={12} color="#6b7280" />
                    <Text style={styles.timeText}>{formatTime(task.timeLogged)}</Text>
                  </View>
                )}
              </View>

              {/* Relative Time */}
              <Text style={styles.relativeTime}>Updated {formatRelativeTime(task.updatedAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.actionMenuTitle, { color: colors.text }]}>Task Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'edit')}
            >
              <Edit3 size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Edit Task</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'changeStatus')}
            >
              <PlayCircle size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Change Status</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'timer')}
            >
              <Clock size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Start/Stop Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'duplicate')}
            >
              <Copy size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Duplicate Task</Text>
            </TouchableOpacity>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'delete')}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete Task</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 16,
  },
  tabsList: {
    paddingHorizontal: 24,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 4,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tabCountActive: {
    color: '#bfdbfe',
  },
  scrollView: {
    flex: 1,
  },
  tasksList: {
    padding: 24,
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  taskTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskTagText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  taskTagMore: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskTagMoreText: {
    fontSize: 11,
    color: '#6b7280',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  relativeTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenu: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  actionDivider: {
    height: 1,
    marginVertical: 4,
  },
});
