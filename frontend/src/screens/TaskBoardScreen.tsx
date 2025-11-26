import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MoreVertical, Edit3, Trash2, PlayCircle, Calendar, StopCircle, X, Check, Filter, Search } from 'lucide-react-native';
import { useTasks, Task } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as RNCalendar } from 'react-native-calendars';
import Toast from '../components/Toast';
import LoadingOverlay from '../components/LoadingOverlay';

export default function TaskBoardScreen() {
  const { tasks, updateTask, deleteTask, startTimer, stopTimer } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null); // Track which task's date is being edited
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // Track temporarily selected date before confirming
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTaskId, setStatusTaskId] = useState<string | null>(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityTaskId, setPriorityTaskId] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all'); // all, overdue, today, week, month
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const statusTask = statusTaskId ? tasks.find(t => t.id === statusTaskId) : null;
  const priorityTask = priorityTaskId ? tasks.find(t => t.id === priorityTaskId) : null;

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const showLoading = (message: string) => {
    setLoadingMessage(message);
  };

  const hideLoading = () => {
    setLoadingMessage(null);
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const isTimerRunning = (task: Task) => {
    return task.timerStatus === 'running';
  };

  const getTaskDuration = (task: Task) => {
    if (task.timerStatus === 'running' && task.timerStartedAt) {
      const startTime = new Date(task.timerStartedAt).getTime();
      const now = currentTime.getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      return (task.timeSpent || 0) + elapsed;
    }
    return task.timeSpent || 0;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      case 'high':
        return { bg: '#fed7aa', text: '#9a3412', border: '#f97316' };
      case 'medium':
        return { bg: '#fef3c7', text: '#854d0e', border: '#eab308' };
      case 'low':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getPriorityOrder = (priority: string) => {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return order[priority] ?? 99;
  };

  const formatRelativeTime = (date?: Date) => {
    if (!date) return '';
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

  const handleTaskAction = async (taskId: string, action: string) => {
    setShowActionMenu(false);
    
    switch (action) {
      case 'edit':
        const taskToEdit = tasks.find(t => t.id === taskId);
        if (taskToEdit) {
          setEditingTask(taskToEdit);
          setShowEditModal(true);
        }
        break;
      case 'changeStatus':
        const taskToChange = tasks.find(t => t.id === taskId);
        if (taskToChange) {
          setStatusTaskId(taskId);
          setShowStatusModal(true);
        }
        setSelectedTask(null);
        break;
      case 'changePriority':
        setPriorityTaskId(taskId);
        setShowPriorityModal(true);
        setSelectedTask(null);
        break;
      case 'delete':
        await deleteTask(taskId);
        setSelectedTask(null);
        break;
      case 'timer':
        const t = tasks.find(t => t.id === taskId);
        if (t) {
          try {
            if (isTimerRunning(t)) {
              await stopTimer(taskId);
            } else {
              await startTimer(taskId);
            }
          } catch (error) {
            showToast('Failed to update timer. Please try again.', 'error');
          }
        }
        setSelectedTask(null);
        break;
      default:
        setSelectedTask(null);
        break;
    }
  };

  const saveTaskChanges = async () => {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate
      });
      setShowEditModal(false);
      setEditingTask(null);
      setSelectedTask(null);
    }
  };

  const filterTasks = () => {
    let filtered = activeTab === 'all' ? tasks : tasks.filter(task => task.status === activeTab);
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Apply due date filter
    if (dueDateFilter !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        switch (dueDateFilter) {
          case 'overdue':
            return dueDate < now && task.status !== 'completed';
          case 'today':
            return dueDate.getTime() === now.getTime();
          case 'week':
            const weekFromNow = new Date(now);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate >= now && dueDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(now);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return dueDate >= now && dueDate <= monthFromNow;
          default:
            return true;
        }
      });
    }
    
    // Sort by priority (urgent first)
    return filtered.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
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

      {/* Search and Filter Bar */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { 
            backgroundColor: (priorityFilter !== 'all' || dueDateFilter !== 'all') ? colors.primary : colors.background,
            borderColor: (priorityFilter !== 'all' || dueDateFilter !== 'all') ? colors.primary : colors.border
          }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={18} color={(priorityFilter !== 'all' || dueDateFilter !== 'all') ? '#ffffff' : colors.text} />
          {(priorityFilter !== 'all' || dueDateFilter !== 'all') && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {[priorityFilter !== 'all' ? 1 : 0, dueDateFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
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
                {/* Priority Badge - Clickable */}
                <TouchableOpacity 
                  style={[
                    styles.priorityBadge, 
                    { 
                      backgroundColor: getPriorityColor(task.priority).bg,
                      borderColor: getPriorityColor(task.priority).border
                    }
                  ]}
                  onPress={() => {
                    setPriorityTaskId(task.id);
                    setShowPriorityModal(true);
                  }}
                >
                  <Text style={[styles.priorityText, { color: getPriorityColor(task.priority).text }]}>
                    {getPriorityLabel(task.priority)}
                  </Text>
                </TouchableOpacity>
                
                {task.tags?.slice(0, 2).map(tag => (
                  <View key={tag} style={[styles.taskTag, { backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe' }]}>
                    <Text style={[styles.taskTagText, { color: isDarkMode ? '#93c5fd' : '#1e40af' }]}>{tag}</Text>
                  </View>
                ))}
                {task.tags?.length > 2 && (
                  <View style={[styles.taskTag, styles.taskTagMore]}>
                    <Text style={styles.taskTagMoreText}>+{task.tags.length - 2}</Text>
                  </View>
                )}
              </View>

              {/* Due Date - Clickable */}
              {formatDueDate(task.dueDate) && (
                <TouchableOpacity 
                  style={styles.dueDateContainer}
                  onPress={() => {
                    setDatePickerTaskId(task.id);
                    setEditingTask(task);
                    setShowCalendarModal(true);
                  }}
                >
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
                </TouchableOpacity>
              )}

              {/* Footer */}
              <View style={styles.taskFooter}>
                <TouchableOpacity 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status).bg }]}
                  onPress={() => {
                    setStatusTaskId(task.id);
                    setShowStatusModal(true);
                  }}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(task.status).text }]}>
                    {getStatusLabel(task.status)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.timeContainer}>
                  {task.status === 'in-progress' && (
                    <TouchableOpacity
                      style={[styles.timerButton, { 
                        backgroundColor: isTimerRunning(task) ? '#fee2e2' : colors.primary + '20',
                        borderColor: isTimerRunning(task) ? '#ef4444' : colors.primary
                      }]}
                      onPress={async () => {
                        try {
                          if (isTimerRunning(task)) {
                            await stopTimer(task.id);
                          } else {
                            await startTimer(task.id);
                          }
                        } catch (error) {
                          showToast('Failed to update timer', 'error');
                        }
                      }}
                    >
                      {isTimerRunning(task) ? (
                        <>
                          <StopCircle size={14} color="#ef4444" />
                          <Text style={[styles.timerButtonText, { color: '#ef4444' }]}>
                            {formatTime(getTaskDuration(task))}
                          </Text>
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} color={colors.primary} />
                          <Text style={[styles.timerButtonText, { color: colors.primary }]}>
                            {task.timeSpent > 0 ? formatTime(task.timeSpent) : 'Start'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {task.status === 'completed' && task.timeSpent > 0 && (
                    <View style={[styles.durationBadge, { backgroundColor: '#d1fae5', borderColor: '#065f46' }]}>
                      <Clock size={12} color="#065f46" />
                      <Text style={[styles.durationText, { color: '#065f46' }]}>
                        Duration: {formatTime(task.timeSpent)}
                      </Text>
                    </View>
                  )}
                  {task.status !== 'in-progress' && task.status !== 'completed' && task.timeSpent > 0 && (
                    <View style={styles.timeDisplay}>
                      <Clock size={12} color="#6b7280" />
                      <Text style={styles.timeText}>{formatTime(task.timeSpent)}</Text>
                    </View>
                  )}
                </View>
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
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'changePriority')}
            >
              <Calendar size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>Change Priority</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => selectedTask && handleTaskAction(selectedTask, 'timer')}
            >
              {selectedTask && tasks.find(t => t.id === selectedTask) && isTimerRunning(tasks.find(t => t.id === selectedTask)!) ? (
                <>
                  <StopCircle size={18} color="#ef4444" />
                  <Text style={[styles.actionText, { color: "#ef4444" }]}>Stop Timer</Text>
                </>
              ) : (
                <>
                  <Clock size={18} color={colors.text} />
                  <Text style={[styles.actionText, { color: colors.text }]}>Start Timer</Text>
                </>
              )}
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

      {/* Edit Task Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, { backgroundColor: colors.surface }]}>
            <View style={styles.editModalHeader}>
              <Text style={[styles.editModalTitle, { color: colors.text }]}>Edit Task</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editingTask?.title}
                  onChangeText={(text) => setEditingTask(prev => prev ? { ...prev, title: text } : null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={editingTask?.description}
                  onChangeText={(text) => setEditingTask(prev => prev ? { ...prev, description: text } : null)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Status</Text>
                <View style={styles.statusOptions}>
                  {['todo', 'in-progress', 'completed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        { 
                          borderColor: editingTask?.status === status ? colors.primary : colors.border,
                          backgroundColor: editingTask?.status === status ? colors.primary + '20' : 'transparent'
                        }
                      ]}
                      onPress={() => setEditingTask(prev => prev ? { ...prev, status: status as any } : null)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        { color: editingTask?.status === status ? colors.primary : colors.textSecondary }
                      ]}>
                        {getStatusLabel(status)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
                <View style={styles.statusOptions}>
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.statusOption,
                        { 
                          borderColor: editingTask?.priority === priority ? getPriorityColor(priority).border : colors.border,
                          backgroundColor: editingTask?.priority === priority ? getPriorityColor(priority).bg : 'transparent'
                        }
                      ]}
                      onPress={() => setEditingTask(prev => prev ? { ...prev, priority: priority as any } : null)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        { color: editingTask?.priority === priority ? getPriorityColor(priority).text : colors.textSecondary }
                      ]}>
                        {getPriorityLabel(priority)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date</Text>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color={colors.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: editingTask?.dueDate ? colors.text : colors.textSecondary }]}>
                    {editingTask?.dueDate ? new Date(editingTask.dueDate).toLocaleDateString() : 'Set due date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={editingTask?.dueDate ? new Date(editingTask.dueDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setEditingTask(prev => prev ? { ...prev, dueDate: selectedDate } : null);
                    }
                    setDatePickerTaskId(null);
                  }}
                />
              )}
            </ScrollView>

            <View style={[styles.editModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.footerButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveTaskChanges}
              >
                <Text style={[styles.footerButtonText, { color: '#ffffff' }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.actionMenuTitle, { color: colors.text }]}>Change Status</Text>
            
            {['todo', 'in-progress', 'completed'].map((status) => (
              <TouchableOpacity 
                key={status}
                style={[
                  styles.actionItem, 
                  statusTask?.status === status && { backgroundColor: colors.primary + '10' }
                ]}
                onPress={async () => {
                  if (statusTaskId) {
                    try {
                      await updateTask(statusTaskId, { status: status as any });
                      setShowStatusModal(false);
                      setStatusTaskId(null);
                    } catch (error) {
                      showToast('Failed to update status. Please try again.', 'error');
                      // Close modal on error too, to avoid stale state confusion
                      setShowStatusModal(false);
                      setStatusTaskId(null);
                    }
                  }
                }}
              >
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(status).text }]}>
                    {getStatusLabel(status)}
                  </Text>
                </View>
                {statusTask?.status === status && (
                  <Check size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Priority Selection Modal */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriorityModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriorityModal(false)}
        >
          <View style={[styles.actionMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.actionMenuTitle, { color: colors.text }]}>Change Priority</Text>
            
            {['low', 'medium', 'high', 'urgent'].map((priority) => (
              <TouchableOpacity 
                key={priority}
                style={[
                  styles.actionItem, 
                  priorityTask?.priority === priority && { backgroundColor: getPriorityColor(priority).bg }
                ]}
                onPress={async () => {
                  if (priorityTaskId) {
                    try {
                      await updateTask(priorityTaskId, { priority: priority as any });
                      setShowPriorityModal(false);
                      setPriorityTaskId(null);
                    } catch (error) {
                      showToast('Failed to update priority. Please try again.', 'error');
                      setShowPriorityModal(false);
                      setPriorityTaskId(null);
                    }
                  }
                }}
              >
                <View style={[
                  styles.priorityBadge, 
                  { 
                    backgroundColor: getPriorityColor(priority).bg,
                    borderColor: getPriorityColor(priority).border
                  }
                ]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(priority).text }]}>
                    {getPriorityLabel(priority)}
                  </Text>
                </View>
                {priorityTask?.priority === priority && (
                  <Check size={18} color={getPriorityColor(priority).text} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.filterModalHeader}>
              <Text style={[styles.filterModalTitle, { color: colors.text }]}>Filter Tasks</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              {/* Priority Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Priority</Text>
                <View style={styles.filterOptions}>
                  {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.filterOptionButton,
                        { 
                          backgroundColor: priorityFilter === priority ? colors.primary + '20' : colors.background,
                          borderColor: priorityFilter === priority ? colors.primary : colors.border
                        }
                      ]}
                      onPress={() => setPriorityFilter(priority)}
                    >
                      {priorityFilter === priority && (
                        <Check size={16} color={colors.primary} />
                      )}
                      <Text style={[
                        styles.filterOptionText,
                        { color: priorityFilter === priority ? colors.primary : colors.text }
                      ]}>
                        {priority === 'all' ? 'All Priorities' : getPriorityLabel(priority)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Due Date</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'All Dates' },
                    { key: 'overdue', label: 'Overdue' },
                    { key: 'today', label: 'Due Today' },
                    { key: 'week', label: 'Due This Week' },
                    { key: 'month', label: 'Due This Month' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOptionButton,
                        { 
                          backgroundColor: dueDateFilter === option.key ? colors.primary + '20' : colors.background,
                          borderColor: dueDateFilter === option.key ? colors.primary : colors.border
                        }
                      ]}
                      onPress={() => setDueDateFilter(option.key)}
                    >
                      {dueDateFilter === option.key && (
                        <Check size={16} color={colors.primary} />
                      )}
                      <Text style={[
                        styles.filterOptionText,
                        { color: dueDateFilter === option.key ? colors.primary : colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={[styles.filterModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.filterFooterButton, { borderColor: colors.border }]}
                onPress={() => {
                  setPriorityFilter('all');
                  setDueDateFilter('all');
                }}
              >
                <Text style={[styles.filterFooterButtonText, { color: colors.text }]}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterFooterButton, styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.filterFooterButtonText, { color: '#ffffff' }]}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Beautiful Calendar Modal for Due Date Selection */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCalendarModal(false);
          setDatePickerTaskId(null);
          setEditingTask(null);
          setSelectedDate(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.calendarModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.calendarModalTitle, { color: colors.text }]}>Select Due Date</Text>
              <TouchableOpacity onPress={() => {
                setShowCalendarModal(false);
                setDatePickerTaskId(null);
                setEditingTask(null);
                setSelectedDate(null);
              }}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <RNCalendar
              current={editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : undefined}
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                // Just update the selected date, don't save yet
                setSelectedDate(day.dateString);
              }}
              markedDates={{
                [selectedDate || (editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '')]: {
                  selected: true,
                  selectedColor: colors.primary,
                }
              }}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary + '60',
                monthTextColor: colors.text,
                textMonthFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
                arrowColor: colors.primary,
              }}
              style={{
                borderRadius: 12,
              }}
            />

            {/* Show selected date info */}
            {selectedDate && (
              <View style={[styles.selectedDateInfo, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.selectedDateText, { color: colors.text }]}>
                  Selected: {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            )}

            <View style={[styles.calendarModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowCalendarModal(false);
                  setDatePickerTaskId(null);
                  setEditingTask(null);
                  setSelectedDate(null);
                }}
              >
                <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.footerButton, 
                  styles.saveButton, 
                  { 
                    backgroundColor: selectedDate ? colors.primary : colors.border,
                    opacity: (selectedDate && !isUpdatingDate) ? 1 : 0.5 
                  }
                ]}
                disabled={!selectedDate || isUpdatingDate}
                onPress={async () => {
                  if (selectedDate && datePickerTaskId) {
                    // Close modal immediately
                    setShowCalendarModal(false);
                    setIsUpdatingDate(true);
                    showLoading('Updating due date...');
                    
                    try {
                      const newDate = new Date(selectedDate);
                      await updateTask(datePickerTaskId, { dueDate: newDate });
                      
                      // Show success feedback
                      hideLoading();
                      showToast('Due date updated successfully!', 'success');
                    } catch (error) {
                      hideLoading();
                      showToast('Failed to update due date', 'error');
                    } finally {
                      setIsUpdatingDate(false);
                      setDatePickerTaskId(null);
                      setEditingTask(null);
                      setSelectedDate(null);
                    }
                  }
                }}
              >
                <Text style={[styles.footerButtonText, { color: '#ffffff' }]}>
                  {isUpdatingDate ? 'Updating...' : 'Confirm Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Legacy Date Picker for Edit Modal (kept for compatibility) */}
      {showDatePicker && !showCalendarModal && (
        <DateTimePicker
          value={editingTask?.dueDate ? new Date(editingTask.dueDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={async (event, selectedDate) => {
            // On Android, we need to check if user confirmed the selection
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            
            // Only update if user confirmed (event.type === 'set') and date is valid
            if (event.type === 'set' && selectedDate && datePickerTaskId) {
              try {
                await updateTask(datePickerTaskId, { dueDate: selectedDate });
                showToast('Due date updated successfully!', 'success');
              } catch (error) {
                showToast('Failed to update due date', 'error');
              }
            }
            
            // Clean up on iOS after selection or Android after dismissal
            if (Platform.OS === 'ios' || event.type === 'dismissed') {
              setDatePickerTaskId(null);
              setEditingTask(null);
            }
          }}
        />
      )}

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Loading Overlay */}
      <LoadingOverlay visible={!!loadingMessage} message={loadingMessage || 'Loading...'} />
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
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
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
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
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
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  timerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
  editModal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editModalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 16,
  },
  editModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterModalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterModalBody: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  filterFooterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    borderWidth: 0,
  },
  calendarModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
});
