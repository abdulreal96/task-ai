import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, X, Check } from 'lucide-react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import liveKitService, { ExtractedTask } from '../services/livekit';

export default function RecordTaskWithLiveKitScreen({ navigation }: any) {
  const { addTask } = useTasks();
  const { colors, isDarkMode } = useTheme();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [status, setStatus] = useState('Ready to connect');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Register callbacks
    liveKitService.onTranscript((text) => {
      setTranscript((prev) => prev + ' ' + text);
    });

    liveKitService.onTasksExtracted((tasks) => {
      setExtractedTasks(tasks);
      setShowConfirmation(true);
    });

    liveKitService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      // Cleanup on unmount
      if (liveKitService.isConnected()) {
        liveKitService.disconnect();
      }
    };
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatus('Connecting to AI...');
      
      const roomName = `task-room-${Date.now()}`;
      const participantName = 'User';
      
      await liveKitService.connect({
        roomName,
        participantName,
      });
      
      setIsConnected(true);
      setStatus('Connected - Start speaking');
      setIsConnecting(false);
    } catch (error: any) {
      setIsConnecting(false);
      setStatus('Connection failed');
      Alert.alert('Connection Error', error.message || 'Failed to connect to AI assistant');
    }
  };

  const handleDisconnect = async () => {
    try {
      await liveKitService.disconnect();
      setIsConnected(false);
      setStatus('Disconnected');
      setTranscript('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const handleConfirmTasks = async () => {
    try {
      await liveKitService.confirmTasks(true);
      
      // Add tasks to the app
      for (const task of extractedTasks) {
        await addTask({
          title: task.title,
          description: task.description || '',
          priority: task.priority as any,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          tags: task.project ? [task.project] : [],
          status: 'todo',
          timeSpent: 0,
        });
      }
      
      Alert.alert('Success', `${extractedTasks.length} task(s) created successfully`);
      
      setExtractedTasks([]);
      setShowConfirmation(false);
      setTranscript('');
      
      // Navigate back or stay connected for more tasks
      handleDisconnect();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  const handleRejectTasks = async () => {
    try {
      await liveKitService.confirmTasks(false);
      setExtractedTasks([]);
      setShowConfirmation(false);
      setTranscript('');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject tasks');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI Voice Assistant</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status Display */}
        <View style={[styles.statusContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>{status}</Text>
        </View>

        {/* Connection Button */}
        {!isConnected && (
          <View style={styles.centerContent}>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.primary }]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Mic size={32} color="#ffffff" />
                  <Text style={styles.connectButtonText}>Connect to AI</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Tap to start a conversation with the AI assistant
            </Text>
          </View>
        )}

        {/* Connected State */}
        {isConnected && !showConfirmation && (
          <View style={styles.centerContent}>
            <View style={[styles.micIcon, { backgroundColor: colors.primary + '20' }]}>
              <Mic size={64} color={colors.primary} />
            </View>
            <Text style={[styles.listeningText, { color: colors.text }]}>Listening...</Text>
            
            {transcript && (
              <View style={[styles.transcriptBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.transcriptLabel, { color: colors.textSecondary }]}>Transcript:</Text>
                <Text style={[styles.transcriptText, { color: colors.text }]}>{transcript}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.disconnectButton, { borderColor: colors.border }]}
              onPress={handleDisconnect}
            >
              <MicOff size={20} color={colors.text} />
              <Text style={[styles.disconnectButtonText, { color: colors.text }]}>End Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Task Confirmation */}
        {showConfirmation && (
          <View style={styles.confirmationContainer}>
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>
              AI extracted {extractedTasks.length} task(s)
            </Text>
            
            <View style={styles.tasksList}>
              {extractedTasks.map((task, index) => (
                <View key={index} style={[styles.taskCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  {task.description && (
                    <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                      {task.description}
                    </Text>
                  )}
                  <View style={styles.taskMeta}>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: task.priority === 'high' ? '#fee2e2' : 
                                       task.priority === 'medium' ? '#fef3c7' : '#dbeafe'
                    }]}>
                      <Text style={[styles.priorityText, {
                        color: task.priority === 'high' ? '#991b1b' :
                               task.priority === 'medium' ? '#854d0e' : '#1e40af'
                      }]}>
                        {task.priority}
                      </Text>
                    </View>
                    {task.dueDate && (
                      <Text style={[styles.dueDateText, { color: colors.textSecondary }]}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.rejectButton, { borderColor: colors.border }]}
                onPress={handleRejectTasks}
              >
                <X size={20} color={colors.text} />
                <Text style={[styles.rejectButtonText, { color: colors.text }]}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleConfirmTasks}
              >
                <Check size={20} color="#ffffff" />
                <Text style={styles.confirmButtonText}>Confirm & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpText: {
    marginTop: 24,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  micIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  listeningText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  transcriptBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    maxHeight: 200,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmationContainer: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tasksList: {
    flex: 1,
    gap: 12,
  },
  taskCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDateText: {
    fontSize: 12,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
