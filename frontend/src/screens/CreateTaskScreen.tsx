import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ProjectSelector from '../components/ProjectSelector';
import Toast from '../components/Toast';
import LoadingOverlay from '../components/LoadingOverlay';

export default function CreateTaskScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { addTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [projectName, setProjectName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const statuses = [
    { value: 'todo', label: 'To Do', color: '#6b7280' },
    { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#6b7280' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626' },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate?.toISOString(),
      };

      // Add project info
      if (projectId) {
        taskData.projectId = projectId;
      } else if (projectName) {
        taskData.projectName = projectName;
      }

      await addTask(taskData);
      showToast('Task created successfully', 'success');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      showToast(error.message || 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Task Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter task title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Add more context (optional)"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Project */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Project</Text>
          <ProjectSelector
            selectedProjectId={projectId}
            selectedProjectName={projectName}
            onSelectProject={(id, name) => {
              setProjectId(id);
              setProjectName(name);
            }}
          />
        </View>

        {/* Status Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Status</Text>
          <View style={styles.chipContainer}>
            {statuses.map((s) => (
              <TouchableOpacity
                key={s.value}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: status === s.value ? s.color : colors.border },
                  status === s.value && { backgroundColor: s.color + '20' }
                ]}
                onPress={() => setStatus(s.value)}
              >
                <Text style={[styles.chipText, { color: status === s.value ? s.color : colors.text }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={styles.chipContainer}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.chip,
                  { backgroundColor: colors.surface, borderColor: priority === p.value ? p.color : colors.border },
                  priority === p.value && { backgroundColor: p.color + '20' }
                ]}
                onPress={() => setPriority(p.value)}
              >
                <Text style={[styles.chipText, { color: priority === p.value ? p.color : colors.text }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.text} />
            <Text style={[styles.dateButtonText, { color: dueDate ? colors.text : colors.textSecondary }]}>
              {dueDate ? dueDate.toLocaleDateString() : 'Select due date (optional)'}
            </Text>
            {dueDate && (
              <TouchableOpacity onPress={() => setDueDate(undefined)}>
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <AlertCircle size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            You can always edit these details later from the task board.
          </Text>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }, !title.trim() && styles.createButtonDisabled]}
          onPress={handleCreateTask}
          disabled={!title.trim() || loading}
        >
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>

      {loading && <LoadingOverlay visible={true} message="Creating task..." />}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
