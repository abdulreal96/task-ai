import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, X, Check, Edit3, Send } from 'lucide-react-native';
import { useTasks, Task } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export default function RecordTaskScreen() {
  const { addTask } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSpeechModuleReady, setIsSpeechModuleReady] = useState<boolean>(() => {
    return (
      !!ExpoSpeechRecognitionModule &&
      typeof ExpoSpeechRecognitionModule.start === "function"
    );
  });
  const [speechServicePackage, setSpeechServicePackage] = useState<string | null>(null);
  const [isInClarificationMode, setIsInClarificationMode] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
      setTranscript('');
      setInterimTranscript('');
  const joinTranscriptParts = useCallback((...parts: string[]) => {
    return parts
      .filter((part) => !!part && part.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const displayedTranscript = useMemo(() => {
    return joinTranscriptParts(transcript, isRecording ? interimTranscript : '');
  }, [interimTranscript, isRecording, joinTranscriptParts, transcript]);

  const hasTranscriptContent = displayedTranscript.length > 0;

  // Animation values using useRef
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(10))
  ).current;

  // Check permissions on mount
  useEffect(() => {
    const ready =
      !!ExpoSpeechRecognitionModule &&
      typeof ExpoSpeechRecognitionModule.start === "function" &&
      typeof ExpoSpeechRecognitionModule.requestPermissionsAsync === "function";

    setIsSpeechModuleReady(ready);

    if (!ready) {
      Alert.alert(
        "Configuration Error",
        "Speech recognition is unavailable on this build. Please uninstall the app, install the latest EAS build, and try again."
      );
      return;
    }

    checkPermissions();
  }, []);

  const detectSpeechService = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule || Platform.OS !== "android") {
      console.log("[Speech] Skipping service detection (not Android or module unavailable)");
      return;
    }

    try {
      if (typeof ExpoSpeechRecognitionModule.getSpeechRecognitionServices === "function") {
        const services: string[] = await ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
        console.log("[Speech] Available services:", services);
        
        if (Array.isArray(services) && services.length > 0) {
          const preferredPackages = [
            "com.google.android.googlequicksearchbox",
            "com.google.android.as",
            "com.samsung.android.bixby.agent",
          ];
          const preferred = preferredPackages.find((pkg) => services.includes(pkg));
          const selectedPackage = preferred ?? services[0];
          console.log("[Speech] Selected service:", selectedPackage);
          setSpeechServicePackage(selectedPackage);
          return;
        }
      }

      if (typeof ExpoSpeechRecognitionModule.getDefaultRecognitionService === "function") {
        const defaultService = await ExpoSpeechRecognitionModule.getDefaultRecognitionService();
        console.log("[Speech] Default service:", defaultService);
        if (defaultService?.packageName) {
          setSpeechServicePackage(defaultService.packageName);
          return;
        }
      }

      console.warn("[Speech] No speech services found on device");
      Alert.alert(
        "Speech Service Required",
        "No speech recognition service found. Please install 'Speech Services by Google' from the Play Store."
      );
    } catch (error) {
      console.error("[Speech] Service detection error:", error);
    }
  }, []);

  useEffect(() => {
    if (isSpeechModuleReady) {
      detectSpeechService();
    }
  }, [isSpeechModuleReady, detectSpeechService]);

  const checkPermissions = async () => {
    try {
      if (
        !ExpoSpeechRecognitionModule ||
        typeof ExpoSpeechRecognitionModule.getPermissionsAsync !== "function" ||
        typeof ExpoSpeechRecognitionModule.requestPermissionsAsync !== "function"
      ) {
        return;
      }
      
      const result = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      setHasPermission(result.granted);
      
      if (!result.granted) {
        // Request permissions immediately
        const requestResult = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setHasPermission(requestResult.granted);
        
        if (!requestResult.granted) {
          Alert.alert(
            "Permission Required",
            "Microphone permission is required for voice recording. Please enable it in your device settings.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error: any) {
      console.error("Permission check failed:", error);
      Alert.alert("Error", "Failed to check permissions: " + error.message);
    }
  };

  const handleResultEvent = useCallback((event: any) => {
    if (!event?.results || !Array.isArray(event.results) || event.results.length === 0) {
      return;
    }

    const latestResult = event.results[event.results.length - 1];
    const latestTranscript = latestResult?.transcript?.trim();
    const isFinalResult = latestResult?.isFinal ?? event?.isFinal ?? false;

    if (!latestTranscript) {
      setInterimTranscript('');
      return;
    }

    if (isFinalResult) {
      setTranscript((prev) => joinTranscriptParts(prev, latestTranscript));
      setInterimTranscript('');
    } else {
      setInterimTranscript(latestTranscript);
    }
  }, [joinTranscriptParts]);

  const handleErrorEvent = useCallback((event: any) => {
    if (!event) {
      return;
    }

    console.error("Speech recognition error:", event);
    const errorCode = event.error;
    
    // Ignore "client" errors that occur after successful stop
    // These are harmless and happen when the recognizer cleans up
    if (errorCode === "client" || errorCode === "aborted") {
      console.log("[Speech] Ignoring harmless error:", errorCode);
      return;
    }

    const message = event.message || event.error || "Unknown error occurred";
    setRecognitionError(message);
    setIsRecording(false);
    Alert.alert("Speech Recognition Error", message);
  }, []);

  const handleEndEvent = useCallback(() => {
    setIsRecording(false);
    setTranscript((prev) => joinTranscriptParts(prev, interimTranscript));
    setInterimTranscript('');
  }, [interimTranscript, joinTranscriptParts]);

  useEffect(() => {
    if (
      !isSpeechModuleReady ||
      !ExpoSpeechRecognitionModule ||
      typeof (ExpoSpeechRecognitionModule as any).addListener !== "function"
    ) {
      return;
    }

    const resultSub = (ExpoSpeechRecognitionModule as any).addListener(
      "result",
      handleResultEvent
    );
    const errorSub = (ExpoSpeechRecognitionModule as any).addListener(
      "error",
      handleErrorEvent
    );
    const endSub = (ExpoSpeechRecognitionModule as any).addListener(
      "end",
      handleEndEvent
    );

    return () => {
      resultSub?.remove?.();
      errorSub?.remove?.();
      endSub?.remove?.();
    };
  }, [
    isSpeechModuleReady,
    handleResultEvent,
    handleErrorEvent,
    handleEndEvent,
  ]);

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
    } else {
      // Stop animations
      pulseAnim.stopAnimation();
      waveAnimations.forEach((anim) => anim.stopAnimation());
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (
        !isSpeechModuleReady ||
        !ExpoSpeechRecognitionModule ||
        typeof ExpoSpeechRecognitionModule.requestPermissionsAsync !== "function" ||
        typeof ExpoSpeechRecognitionModule.start !== "function"
      ) {
        Alert.alert(
          "Configuration Error",
          "Speech recognition is unavailable. Please reinstall the latest build before recording."
        );
        return;
      }

      setTranscript('');
      setInterimTranscript('');
      setRecognitionError(null);
      
      // Check permission first
      if (hasPermission === false) {
        Alert.alert(
          "Permission Required",
          "Please enable microphone permission in your device settings to use voice recording."
        );
        return;
      }

      // Request permissions again if not sure
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(
          "Permission Denied",
          "Microphone permission is required for voice recording. Please enable it in your device settings."
        );
        setHasPermission(false);
        return;
      }

      setHasPermission(true);

      // Start live speech recognition
      const recognitionOptions: Record<string, any> = {
        lang: "en-US",
        interimResults: true, // Get live results as you speak
        maxAlternatives: 1,
        continuous: true, // Keep listening until stopped
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
        contextualStrings: ["task", "todo", "implement", "fix", "bug", "feature"],
        // Android-specific options
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: "free_form",
          EXTRA_PARTIAL_RESULTS: true,
        },
      };

      // Only specify a service package if we successfully detected one
      // If null/undefined, Android will use its default service
      if (Platform.OS === "android" && speechServicePackage) {
        console.log("[Speech] Using service:", speechServicePackage);
        recognitionOptions.androidRecognitionServicePackage = speechServicePackage;
      } else if (Platform.OS === "android") {
        console.log("[Speech] No specific service selected, using system default");
      }

      console.log("[Speech] Starting recognition with options:", recognitionOptions);
      await ExpoSpeechRecognitionModule.start(recognitionOptions);

      setIsRecording(true);
    } catch (error: any) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start speech recognition: " + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      if (
        ExpoSpeechRecognitionModule &&
        typeof ExpoSpeechRecognitionModule.stop === "function"
      ) {
        await ExpoSpeechRecognitionModule.stop();
      }
      setIsRecording(false);
      setTranscript((prev) => joinTranscriptParts(prev, interimTranscript));
      setInterimTranscript('');
      
      if (transcript.trim()) {
        setIsEditing(true);
      }
    } catch (error: any) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
    }
  };

  const handleSendToAI = () => {
    const finalizedTranscript = joinTranscriptParts(transcript, interimTranscript);
    if (!finalizedTranscript) {
      Alert.alert('Error', 'Please record or type something first');
      return;
    }
    setTranscript(finalizedTranscript);
    setInterimTranscript('');
    setIsEditing(false);
    processTranscriptWithAI(finalizedTranscript);
  };

  const processTranscriptWithAI = async (inputTranscript?: string) => {
    const transcriptToProcess = (inputTranscript ?? transcript).trim();
    if (!transcriptToProcess) {
      Alert.alert('Error', 'Transcript is empty. Please record again.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Call the real AI backend endpoint
      const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://task-ai.ilimtutor.com';
      const authToken = await getAuthToken();
      
      // Build conversation context
      const conversationContext = isInClarificationMode 
        ? [
            ...conversationHistory,
            { role: 'user' as const, content: transcriptToProcess }
          ]
        : [{ role: 'user' as const, content: transcriptToProcess }];
      
      const response = await fetch(`${API_URL}/ai/extract-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ 
          transcript: transcriptToProcess,
          conversationHistory: conversationContext
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'AI service returned an error');
      }

      // Check if AI needs clarification
      if (data.needsClarification && data.clarificationQuestion) {
        // AI is asking for more information
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: transcriptToProcess },
          { role: 'ai', content: data.clarificationQuestion }
        ]);
        setClarificationQuestion(data.clarificationQuestion);
        setIsInClarificationMode(true);
        setIsProcessing(false);
        setTranscript(''); // Clear for next input
        setInterimTranscript('');
        Alert.alert('Need More Information', data.clarificationQuestion);
        return;
      }

      if (data.success && data.tasks && data.tasks.length > 0) {
        // AI successfully extracted tasks
        setExtractedTasks(data.tasks);
        setIsProcessing(false);
        setShowConfirmation(true);
        // Reset clarification mode
        setIsInClarificationMode(false);
        setClarificationQuestion(null);
        setConversationHistory([]);
      } else {
        // AI failed or returned no tasks - use fallback
        const fallbackTasks = extractTasksFromTranscript(transcriptToProcess);
        setExtractedTasks(fallbackTasks);
        setIsProcessing(false);
        setShowConfirmation(true);
        setIsInClarificationMode(false);
        setClarificationQuestion(null);
        setConversationHistory([]);
        
        if (!data.success) {
          Alert.alert('AI Processing', 'Using fallback task extraction. ' + (data.message || ''));
        }
      }
    } catch (error: any) {
      console.error('AI extraction failed:', error);
      // Network error or API failure - use local fallback
      const fallbackTasks = extractTasksFromTranscript(transcriptToProcess);
      setExtractedTasks(fallbackTasks);
      setIsProcessing(false);
      setShowConfirmation(true);
      setIsInClarificationMode(false);
      setClarificationQuestion(null);
      setConversationHistory([]);
      Alert.alert('Network Error', 'Could not reach AI server. Using basic extraction.');
    }
  };

  const getAuthToken = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      return null;
    }
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
    // Fallback method when AI is unavailable
    return [
      {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        priority: 'medium',
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
      // Save all extracted tasks (can be multiple from AI)
      for (const taskData of extractedTasks) {
        // Ensure all required fields are present with proper defaults
        const taskToSave = {
          title: taskData.title || 'Untitled Task',
          description: taskData.description || taskData.title || '',
          tags: Array.isArray(taskData.tags) ? taskData.tags : ['general'],
          status: 'todo' as const,
          priority: (taskData.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          timeSpent: 0,
          timerStatus: 'stopped' as const,
        };
        
        await addTask(taskToSave);
      }
      
      // Reset
      setTranscript('');
      setInterimTranscript('');
      setExtractedTasks([]);
      setShowConfirmation(false);
      Alert.alert('Success', `${extractedTasks.length} task(s) saved successfully`);
    } catch (error: any) {
      console.error('Failed to save tasks:', error);
      Alert.alert('Error', `Failed to save tasks: ${error.message || 'Please try again.'}`);
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
              {isRecording ? 'Recording...' : 'Tap to speak'}
            </Text>
            <Text style={styles.subText}>
              {isRecording 
                ? 'Tap the button to stop recording' 
                : isInClarificationMode && clarificationQuestion
                ? clarificationQuestion
                : 'Tell me what you need to do and I\'ll organize it for you'
              }
            </Text>

            {/* Show conversation history in clarification mode */}
            {isInClarificationMode && conversationHistory.length > 0 && (
              <View style={[styles.conversationCard, { backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb' }]}>
                <Text style={[styles.conversationTitle, { color: isDarkMode ? '#f9fafb' : '#111827' }]}>Conversation:</Text>
                {conversationHistory.map((msg, idx) => (
                  <View key={idx} style={styles.conversationMessage}>
                    <Text style={[styles.conversationRole, { color: msg.role === 'user' ? '#2563eb' : '#16a34a' }]}>
                      {msg.role === 'user' ? 'You' : 'AI'}:
                    </Text>
                    <Text style={[styles.conversationText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                      {msg.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Live Transcript */}
            {hasTranscriptContent && (
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
                    {displayedTranscript}
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
                <View style={styles.extractedTaskHeader}>
                  <Text style={styles.extractedTaskTitle}>{task.title}</Text>
                  {task.priority && (
                    <View style={[
                      styles.priorityBadge,
                      task.priority === 'urgent' && styles.priorityUrgent,
                      task.priority === 'high' && styles.priorityHigh,
                      task.priority === 'medium' && styles.priorityMedium,
                      task.priority === 'low' && styles.priorityLow,
                    ]}>
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>
                  )}
                </View>
                {task.description && task.description !== task.title && (
                  <Text style={styles.extractedTaskDescription} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}
                {task.dueDate && (
                  <Text style={styles.extractedTaskDueDate}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                )}
                <View style={styles.extractedTaskTags}>
                  {task.tags && task.tags.map((tag: string) => (
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
                  setInterimTranscript('');
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
  conversationCard: {
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    maxWidth: 400,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  conversationMessage: {
    marginBottom: 8,
  },
  conversationRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  conversationText: {
    fontSize: 13,
    lineHeight: 18,
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
  extractedTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  extractedTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  extractedTaskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  extractedTaskDueDate: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityUrgent: {
    backgroundColor: '#fee2e2',
  },
  priorityHigh: {
    backgroundColor: '#fed7aa',
  },
  priorityMedium: {
    backgroundColor: '#fef3c7',
  },
  priorityLow: {
    backgroundColor: '#dbeafe',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#111827',
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
