import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, X, Check, Edit3, Send } from 'lucide-react-native';
import { useTasks, Task } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecordTaskScreen() {
  const { addTask } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // For now, we'll simulate voice input with a text box
  // Real voice recording would need expo-av + backend transcription

  // Animation values using useRef
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(10))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation for mic button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Waveform animation
      waveAnimations.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: Math.random() * 40 + 10,
              duration: 500,
              delay: index * 50,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 10,
              duration: 500,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });

      // Simulate typing (placeholder for real speech recognition)
      simulateTyping();
    }
  }, [isRecording]);

  const simulateTyping = () => {
    const sampleText = "I need to implement the wallet balance feature for the transporter module";
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < sampleText.length && isRecording) {
        setTranscript(sampleText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 50);
  };

  const startRecording = () => {
    setTranscript('');
    setIsRecording(true);
    // In production, this would start audio recording
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (transcript.trim()) {
      setIsEditing(true);
    }
  };

  const handleSendToAI = () => {
    if (!transcript.trim()) {
      Alert.alert('Error', 'Please record or type something first');
      return;
    }
    setIsEditing(false);
    processTranscript();
  };

  const processTranscript = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const tasks = extractTasksFromTranscript(transcript);
      setExtractedTasks(tasks);
      setIsProcessing(false);
      setShowConfirmation(true);
    }, 2000);
  };

  const extractTasksFromTranscript = (text: string): any[] => {
    return [
      {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        tags: extractTags(text)
      }
    ];
  };

  const extractTags = (text: string): string[] => {
    const lowerText = text.toLowerCase();
    const tags: string[] = [];
    
    const tagMap: { [key: string]: string } = {
      'implement': 'implement',
      'fix': 'fix',
      'bug': 'bug',
      'design': 'design',
      'wallet': 'wallet',
      'auth': 'authentication',
      'login': 'authentication',
      'dashboard': 'dashboard',
      'api': 'api',
      'database': 'database'
    };
    
    Object.keys(tagMap).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        if (!tags.includes(tagMap[keyword])) {
          tags.push(tagMap[keyword]);
        }
      }
    });
    
    return tags.length > 0 ? tags : ['general'];
  };

  const confirmTasks = async () => {
    try {
      for (const taskData of extractedTasks) {
        await addTask({
          title: taskData.title,
          description: taskData.description,
          tags: taskData.tags,
          status: 'todo',
          priority: 'medium',
          timeSpent: 0,
          timerStatus: 'stopped',
        });
      }
      
      // Reset
      setTranscript('');
      setExtractedTasks([]);
      setShowConfirmation(false);
      Alert.alert('Success', 'Tasks saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks. Please try again.');
    }
  };

  return (
    <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.fullContainer}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Task</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Recording Area */}
      <View style={styles.recordingArea}>
        {!isProcessing && !showConfirmation && (
          <>
            {/* Microphone Button */}
            <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                style={[
                  styles.micButton, 
                  isRecording 
                    ? styles.micButtonRecording 
                    : [styles.micButtonIdle, { backgroundColor: isDarkMode ? '#f3f4f6' : '#ffffff' }]
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Mic size={64} color={isRecording ? '#ffffff' : '#1e40af'} />
              </TouchableOpacity>
            </Animated.View>

            {/* Waveform Animation */}
            {isRecording && (
              <View style={styles.waveformContainer}>
                {waveAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[styles.waveBar, { height: anim }]}
                  />
                ))}
              </View>
            )}

            {/* Instructions */}
            <Text style={styles.mainText}>
              {isRecording ? 'Listening...' : 'Tap to speak'}
            </Text>
            <Text style={styles.subText}>
              {isRecording 
                ? 'Speak naturally about your tasks' 
                : 'Tell me what you need to do and I\'ll organize it for you'
              }
            </Text>

            {/* Live Transcript */}
            {transcript && (
              <View style={[styles.transcriptCard, { backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb' }]}>
                {isEditing ? (
                  <ScrollView style={styles.editContainer}>
                    <TextInput
                      style={[styles.transcriptInput, { color: isDarkMode ? '#f9fafb' : '#111827' }]}
                      value={transcript}
                      onChangeText={setTranscript}
                      multiline
                      placeholder="Edit your transcript here..."
                      placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                      autoFocus
                    />
                  </ScrollView>
                ) : (
                  <Text style={[styles.transcriptText, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>
                    {transcript}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            {transcript && !isRecording && (
              <View style={styles.buttonContainer}>
                {!isEditing ? (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }]} 
                      onPress={() => setIsEditing(true)}
                    >
                      <Edit3 size={18} color={isDarkMode ? '#f9fafb' : '#111827'} />
                      <Text style={[styles.actionButtonText, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.sendButton]} 
                      onPress={handleSendToAI}
                    >
                      <Send size={18} color="#fff" />
                      <Text style={styles.sendButtonText}>Send to AI</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelButton, { backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }]} 
                      onPress={() => setIsEditing(false)}
                    >
                      <X size={18} color={isDarkMode ? '#f9fafb' : '#111827'} />
                      <Text style={[styles.actionButtonText, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.sendButton]} 
                      onPress={handleSendToAI}
                    >
                      <Send size={18} color="#fff" />
                      <Text style={styles.sendButtonText}>Send to AI</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Processing State */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.spinner} />
            <Text style={[styles.processingText, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>Processing with AI...</Text>
            <Text style={[styles.processingSubText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>Extracting tasks and tags</Text>
          </View>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <View style={[styles.confirmationCard, { backgroundColor: isDarkMode ? '#f3f4f6' : '#ffffff' }]}>
            <View style={styles.confirmationHeader}>
              <View style={styles.checkIconContainer}>
                <Check size={20} color="#16a34a" />
              </View>
              <Text style={styles.confirmationTitle}>
                I found {extractedTasks.length} task{extractedTasks.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {extractedTasks.map((task, index) => (
              <View key={index} style={styles.extractedTask}>
                <Text style={styles.extractedTaskTitle}>{task.title}</Text>
                <View style={styles.extractedTaskTags}>
                  {task.tags.map((tag: string) => (
                    <View key={tag} style={styles.extractedTag}>
                      <Text style={styles.extractedTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.tryAgainButton, { backgroundColor: isDarkMode ? '#e5e7eb' : '#ffffff' }]}
                onPress={() => {
                  setShowConfirmation(false);
                  setTranscript('');
                }}
              >
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmTasks}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  recordingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  micContainer: {
    position: 'relative',
    marginBottom: 48,
  },
  micButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonIdle: {
    backgroundColor: '#ffffff',
  },
  micButtonRecording: {
    backgroundColor: '#ef4444',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
    marginBottom: 32,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  mainText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
    maxWidth: 320,
  },
  transcriptCard: {
    marginTop: 32,
    borderRadius: 12,
    padding: 16,
    maxWidth: 400,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transcriptText: {
    fontSize: 14,
  },
  editContainer: {
    maxHeight: 250,
  },
  transcriptInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    // backgroundColor set dynamically
  },
  sendButton: {
    backgroundColor: '#2563eb',
  },
  cancelButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  processButton: {
    marginTop: 32,
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  processingContainer: {
    alignItems: 'center',
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    marginBottom: 16,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  processingSubText: {
    fontSize: 14,
    color: '#bfdbfe',
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  checkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  extractedTask: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  extractedTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  extractedTaskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extractedTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  extractedTagText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '500',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
