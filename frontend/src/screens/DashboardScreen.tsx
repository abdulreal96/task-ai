import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks, Task } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { Mic, ListTodo, BarChart3, Clock, CheckCircle2, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const { tasks } = useTasks();
  const { colors, isDarkMode } = useTheme();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTasks = tasks.filter((t: Task) => {
    const taskDate = new Date(t.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const completedToday = todayTasks.filter((t: Task) => t.status === 'completed').length;
  const totalTimeToday = todayTasks.reduce((acc: number, t: Task) => acc + t.timeLogged, 0);
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in-progress');
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.primary} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Blue Header with Gradient */}
        <View style={[styles.blueHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hello, Abdulwahab 👋</Text>
            <Text style={styles.subGreeting}>Let's make today productive</Text>
          </View>
        </View>

        {/* Stats Cards - Overlapping Header */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
                <ListTodo color={isDarkMode ? '#93c5fd' : '#2563eb'} size={20} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{todayTasks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Created Today</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: isDarkMode ? '#14532d' : '#dcfce7' }]}>
                <CheckCircle2 color={isDarkMode ? '#86efac' : '#16a34a'} size={20} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{completedToday}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIcon, { backgroundColor: isDarkMode ? '#7c2d12' : '#fed7aa' }]}>
                <Clock color={isDarkMode ? '#fdba74' : '#ea580c'} size={20} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(totalTimeToday)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Logged</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionButton, styles.quickActionPrimary, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('RecordTask')}
            >
              <Mic color="#ffffff" size={32} />
              <Text style={styles.quickActionTextPrimary}>Record Task</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('TaskBoard')}
            >
              <ListTodo color={colors.text} size={32} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>View Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Reports')}
            >
              <BarChart3 color={colors.text} size={32} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('TaskBoard')}
            >
              <TrendingUp color="#000000" size={32} />
              <Text style={styles.quickActionText}>Tags</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* In Progress Tasks */}
        {inProgressTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>In Progress</Text>
            <View style={styles.tasksList}>
              {inProgressTasks.map((task: Task) => (
                <TouchableOpacity 
                  key={task.id}
                  style={[styles.taskCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => navigation.navigate('TaskBoard')}
                >
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    {task.tags.slice(0, 3).map((tag: string, index: number) => (
                      <View key={index} style={[styles.taskTag, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
                        <Text style={[styles.taskTagText, { color: isDarkMode ? '#93c5fd' : '#1e40af' }]}>{tag}</Text>
                      </View>
                    ))}
                    {task.timeLogged > 0 && (
                      <View style={styles.taskTime}>
                        <Clock color={colors.textSecondary} size={12} />
                        <Text style={[styles.taskTimeText, { color: colors.textSecondary }]}>{formatTime(task.timeLogged)}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI Suggestion */}
        <View style={styles.section}>
          <View style={[styles.aiCard, { backgroundColor: isDarkMode ? '#4c1d95' : '#fdf4ff', borderColor: isDarkMode ? '#5b21b6' : '#e9d5ff' }]}>
            <View style={[styles.aiIcon, { backgroundColor: isDarkMode ? '#7c3aed' : '#a855f7' }]}>
              <TrendingUp color="#ffffff" size={16} />
            </View>
            <View style={styles.aiContent}>
              <Text style={[styles.aiTitle, { color: colors.text }]}>AI Suggestion</Text>
              <Text style={[styles.aiText, { color: colors.textSecondary }]}>
                You have {tasks.filter((t: Task) => t.status === 'todo').length} pending tasks. 
                Consider starting with high-priority items to stay on track.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  blueHeader: {
    backgroundColor: '#2563eb',
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginTop: -24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    height: 96,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionPrimary: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  quickActionTextPrimary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  tasksList: {
    gap: 8,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  taskTimeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  aiCard: {
    backgroundColor: '#fdf4ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
