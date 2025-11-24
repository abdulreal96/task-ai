import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MoreVertical } from 'lucide-react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

export default function TaskBoardScreen() {
  const { tasks } = useTasks();
  const { colors, isDarkMode } = useTheme();
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
                <TouchableOpacity style={styles.moreButton}>
                  <MoreVertical size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {task.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={styles.taskTag}>
                    <Text style={styles.taskTagText}>{tag}</Text>
                  </View>
                ))}
                {task.tags.length > 3 && (
                  <View style={[styles.taskTag, styles.taskTagMore]}>
                    <Text style={styles.taskTagMoreText}>+{task.tags.length - 3}</Text>
                  </View>
                )}
              </View>

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
});
