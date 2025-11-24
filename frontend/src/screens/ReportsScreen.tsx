import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const { tasks } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

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

  // Status Distribution
  const statusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#9ca3af' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#10b981' }
  ];

  const totalTasks = statusData.reduce((acc, item) => acc + item.value, 0);

  // Tag Distribution
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

  const maxTagCount = Math.max(...tagData.map(t => t.count), 1);

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

  const maxDailyCount = Math.max(...dailyTrendData.flatMap(d => [d.created, d.completed]), 1);

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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reports</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Track your productivity</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === 'daily' ? colors.primary : colors.background }]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'daily' ? '#ffffff' : colors.textSecondary }]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === 'weekly' ? colors.primary : colors.background }]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'weekly' ? '#ffffff' : colors.textSecondary }]}>Weekly</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {activeTab === 'daily' ? (
          <>
            {/* Daily Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Calendar size={16} color="#2563eb" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{dailyStats.created}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks Created</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
                  <CheckCircle2 size={16} color="#16a34a" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{dailyStats.completed}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fed7aa' }]}>
                  <Clock size={16} color="#ea580c" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatTime(dailyStats.timeLogged)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Time Logged</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: '#e9d5ff' }]}>
                  <TrendingUp size={16} color="#9333ea" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{dailyStats.started}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks Started</Text>
              </View>
            </View>

            {/* Status Distribution */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Task Status Distribution</Text>
              <View style={styles.pieChart}>
                {statusData.map((item, index) => {
                  const percentage = totalTasks > 0 ? (item.value / totalTasks) * 100 : 0;
                  return (
                    <View key={index} style={styles.pieItem}>
                      <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                      <View style={styles.pieInfo}>
                        <Text style={[styles.pieName, { color: colors.textSecondary }]}>{item.name}</Text>
                        <Text style={[styles.pieValue, { color: colors.text }]}>{item.value} ({Math.round(percentage)}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top Tags */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Most Used Tags</Text>
              <View style={styles.barChart}>
                {tagData.map((item, index) => {
                  const barWidth = (item.count / maxTagCount) * 100;
                  return (
                    <View key={index} style={styles.barItem}>
                      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{item.name}</Text>
                      <View style={[styles.barContainer, { backgroundColor: colors.background }]}>
                        <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: colors.primary }]} />
                      </View>
                      <Text style={[styles.barValue, { color: colors.text }]}>{item.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Weekly Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Calendar size={16} color="#2563eb" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.created}</Text>
                <Text style={styles.statLabel}>Tasks Created</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#d1fae5' }]}>
                  <CheckCircle2 size={16} color="#16a34a" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fed7aa' }]}>
                  <Clock size={16} color="#ea580c" />
                </View>
                <Text style={styles.statValue}>{formatTime(weeklyStats.timeLogged)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#e9d5ff' }]}>
                  <TrendingUp size={16} color="#9333ea" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.productivity}%</Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </View>

            {/* 7-Day Trend */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>7-Day Trend</Text>
              <View style={styles.trendChart}>
                {dailyTrendData.map((item, index) => {
                  const createdHeight = (item.created / maxDailyCount) * 100;
                  const completedHeight = (item.completed / maxDailyCount) * 100;
                  return (
                    <View key={index} style={styles.trendDay}>
                      <View style={styles.trendBars}>
                        <View style={[styles.trendBar, styles.trendBarCreated, { height: `${createdHeight}%` }]} />
                        <View style={[styles.trendBar, styles.trendBarCompleted, { height: `${completedHeight}%` }]} />
                      </View>
                      <Text style={styles.trendLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.trendLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.legendText}>Created</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendText}>Completed</Text>
                </View>
              </View>
            </View>

            {/* Productivity Score */}
            <View style={styles.productivityCard}>
              <Text style={styles.productivityTitle}>Weekly Productivity Score</Text>
              <View style={styles.productivityScore}>
                <Text style={styles.productivityValue}>{weeklyStats.productivity}</Text>
                <Text style={styles.productivityMax}>/100</Text>
              </View>
              <Text style={styles.productivityMessage}>
                {weeklyStats.productivity >= 80 
                  ? 'Excellent work! Keep it up!' 
                  : weeklyStats.productivity >= 60 
                  ? 'Good progress this week!' 
                  : 'You can do better next week!'}
              </Text>
            </View>
          </>
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
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  pieChart: {
    gap: 12,
  },
  pieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pieDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pieName: {
    fontSize: 14,
    color: '#374151',
  },
  pieValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  barChart: {
    gap: 12,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: '#374151',
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  barValue: {
    width: 32,
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'right',
  },
  trendChart: {
    flexDirection: 'row',
    height: 200,
    gap: 8,
    marginBottom: 16,
  },
  trendDay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  trendBars: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  trendBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  trendBarCreated: {
    backgroundColor: '#3b82f6',
  },
  trendBarCompleted: {
    backgroundColor: '#10b981',
  },
  trendLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  productivityCard: {
    backgroundColor: '#fdf4ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  productivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productivityScore: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  productivityValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111827',
  },
  productivityMax: {
    fontSize: 20,
    color: '#6b7280',
    marginBottom: 4,
  },
  productivityMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
});
