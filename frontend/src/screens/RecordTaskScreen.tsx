import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, TextInput, ScrollView, Alert, Platform, Modal, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, X, Check, Edit3, Send, Sparkles, ListChecks, PenTool } from 'lucide-react-native';
import { useTasks, Task } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

type TaskStatus = 'todo' | 'in-progress' | 'completed';

type EditableExtractedTask = {
  title: string;
  description: string;
  priority: PriorityLevel;
  tags: string[];
  dueDate: string;
  status: TaskStatus;
};

const PRIORITY_OPTIONS: PriorityLevel[] = ['low', 'medium', 'high', 'urgent'];
const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'completed'];

export default function RecordTaskScreen() {
  const { addTask } = useTasks();
  const { colors, isDarkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<EditableExtractedTask[]>([]);
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
  const [activeDatePickerIndex, setActiveDatePickerIndex] = useState<number | null>(null);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [iosPickerDate, setIosPickerDate] = useState(new Date());
  const processingSpinnerAnim = useRef(new Animated.Value(0)).current;
  const processingGlowAnim = useRef(new Animated.Value(0)).current;
  const [processingDots, setProcessingDots] = useState('.');
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  const formatDateInput = useCallback((value?: string | Date) => {
    if (!value) {
      return undefined;
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString().split('T')[0];
  }, []);

  const normalizeExtractedTaskList = useCallback((tasks: any[] = []): EditableExtractedTask[] => {
    return tasks.map((task) => ({
      title: (task?.title || '').trim() || 'Untitled Task',
      description: (task?.description || '').trim(),
      priority: PRIORITY_OPTIONS.includes(task?.priority) ? task.priority : 'medium',
      tags: Array.isArray(task?.tags)
        ? task.tags.filter(Boolean).map((tag: string) => tag.trim()).filter(Boolean)
        : [],
      dueDate: formatDateInput(task?.dueDate) ?? '',
      status: task?.status && STATUS_OPTIONS.includes(task.status)
        ? task.status
        : 'todo',
    }));
  }, [formatDateInput]);

  const updateExtractedTaskField = useCallback((index: number, field: keyof EditableExtractedTask, value: any) => {
    setExtractedTasks((prev) =>
      prev.map((task, taskIndex) => {
        if (taskIndex !== index) {
          return task;
        }

        if (field === 'tags') {
          const tagString = typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : '';
          return {
            ...task,
            tags: tagString
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          };
        }

        if (field === 'dueDate') {
          return {
            ...task,
            dueDate: typeof value === 'string' ? value : formatDateInput(value) ?? '',
          };
        }

        return {
          ...task,
          [field]: value,
        } as EditableExtractedTask;
      })
    );
  }, [formatDateInput]);

  const interimTranscriptRef = useRef('');
  useEffect(() => {
    interimTranscriptRef.current = interimTranscript;
  }, [interimTranscript]);

  const normalizeText = useCallback((text: string) => text?.replace(/\s+/g, ' ').trim() ?? '', []);

  const mergeTranscript = useCallback((existing: string, incoming: string) => {
    const current = normalizeText(existing);
    const next = normalizeText(incoming);

    if (!next) {
      return current;
    }
    if (!current) {
      return next;
    }
    if (next.startsWith(current)) {
      return next;
    }
    if (current.endsWith(next)) {
      return current;
    }
    return normalizeText(`${current} ${next}`);
  }, [normalizeText]);

  const displayedTranscript = useMemo(() => {
    const parts = [transcript, isRecording ? interimTranscript : '']
      .map((part) => normalizeText(part || ''))
      .filter((part) => part.length > 0);
    if (parts.length === 0) {
      return '';
    }
    return normalizeText(parts.join(' '));
  }, [interimTranscript, isRecording, normalizeText, transcript]);

  const hasTranscriptContent = displayedTranscript.length > 0;
  const editableTextColor = useMemo(() => (isDarkMode ? '#020617' : '#0f172a'), [isDarkMode]);
  const formatDueDateDisplay = useCallback((value?: string) => {
    if (!value) {
      return 'Select a date';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Select a date';
    }
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const openDueDatePicker = useCallback((index: number) => {
    const task = extractedTasks[index];
    const currentDate = task?.dueDate ? new Date(task.dueDate) : new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: Number.isNaN(currentDate.getTime()) ? new Date() : currentDate,
        onChange: (_, date) => {
          if (date) {
            updateExtractedTaskField(index, 'dueDate', date);
          }
        },
      });
      return;
    }

    setIosPickerDate(Number.isNaN(currentDate.getTime()) ? new Date() : currentDate);
    setActiveDatePickerIndex(index);
    setShowIosDatePicker(true);
  }, [extractedTasks, updateExtractedTaskField]);

  const closeIosDatePicker = useCallback(() => {
    setShowIosDatePicker(false);
    setActiveDatePickerIndex(null);
  }, []);

  const handleIosDateChange = useCallback((_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setIosPickerDate(selectedDate);
      if (activeDatePickerIndex !== null) {
        updateExtractedTaskField(activeDatePickerIndex, 'dueDate', selectedDate);
      }
    }
  }, [activeDatePickerIndex, updateExtractedTaskField]);

  const clearDueDate = useCallback((index: number) => {
    updateExtractedTaskField(index, 'dueDate', '');
  }, [updateExtractedTaskField]);

  // Animation values using useRef
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnimations = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(10))
  ).current;
  const spinnerRotation = processingSpinnerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const glowOpacity = processingGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.85],
  });
  const glowScale = processingGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.05],
  });

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
      setTranscript((prev) => mergeTranscript(prev, latestTranscript));
      setInterimTranscript('');
    } else {
      setInterimTranscript(latestTranscript);
    }
  }, [mergeTranscript]);

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
    setTranscript((prev) => mergeTranscript(prev, interimTranscriptRef.current));
    setInterimTranscript('');
  }, [mergeTranscript]);

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

  useEffect(() => {
    if (isProcessing) {
      const spinnerLoop = Animated.loop(
        Animated.timing(processingSpinnerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(processingGlowAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(processingGlowAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      spinnerLoop.start();
      glowLoop.start();

      return () => {
        processingSpinnerAnim.stopAnimation(() => processingSpinnerAnim.setValue(0));
        processingGlowAnim.stopAnimation(() => processingGlowAnim.setValue(0));
      };
    }

    processingSpinnerAnim.stopAnimation(() => processingSpinnerAnim.setValue(0));
    processingGlowAnim.stopAnimation(() => processingGlowAnim.setValue(0));
  }, [isProcessing, processingGlowAnim, processingSpinnerAnim]);

  useEffect(() => {
    if (!isProcessing) {
      setProcessingDots('.');
      return;
    }

    const interval = setInterval(() => {
      setProcessingDots((prev) => (prev.length === 3 ? '.' : prev + '.'));
    }, 350);

    return () => clearInterval(interval);
  }, [isProcessing]);

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

      setRecognitionError(null);
      setIsEditing(false);
      setShowConfirmation(false);
      setTranscript((prev) => mergeTranscript(prev, interimTranscriptRef.current));
      setInterimTranscript('');
      
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
      const mergedTranscript = mergeTranscript(transcript, interimTranscriptRef.current);
      setTranscript(mergedTranscript);
      setInterimTranscript('');
      
      if (mergedTranscript) {
        setIsEditing(true);
      }
    } catch (error: any) {
      console.error("Failed to stop recording:", error);
      setIsRecording(false);
    }
  };

  const handleSendToAI = () => {
    const finalizedTranscript = normalizeText(transcript || displayedTranscript);
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
    const transcriptToProcess = normalizeText(inputTranscript ?? transcript);
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
        setExtractedTasks(normalizeExtractedTaskList(data.tasks));
        setIsProcessing(false);
        setShowConfirmation(true);
        setAiMessage(null);
        // Reset clarification mode
        setIsInClarificationMode(false);
        setClarificationQuestion(null);
        setConversationHistory([]);
      } else if (data.success && Array.isArray(data.tasks) && data.tasks.length === 0) {
        setExtractedTasks([]);
        setIsProcessing(false);
        setShowConfirmation(true);
        setAiMessage(data.message || 'I did not detect any actionable engineering tasks. Try adding more implementation details.');
        setIsInClarificationMode(false);
        setClarificationQuestion(null);
        setConversationHistory([]);
      } else {
        // AI failed or returned no tasks - use fallback
        const fallbackTasks = extractTasksFromTranscript(transcriptToProcess);
        setExtractedTasks(normalizeExtractedTaskList(fallbackTasks));
        setIsProcessing(false);
        setShowConfirmation(true);
        setAiMessage(null);
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
      setExtractedTasks(normalizeExtractedTaskList(fallbackTasks));
      setIsProcessing(false);
      setShowConfirmation(true);
      setAiMessage(null);
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

  const extractTasksFromTranscript = (text: string): EditableExtractedTask[] => {
    // Fallback method when AI is unavailable
    return [
      {
        title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        description: text,
        priority: 'medium',
        tags: extractTags(text),
        dueDate: '',
        status: 'todo',
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
        const parsedDueDate = taskData.dueDate ? new Date(taskData.dueDate) : undefined;
        const validDueDate = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : undefined;
        const tags = Array.isArray(taskData.tags) ? taskData.tags.filter(Boolean) : [];

        const taskToSave = {
          title: taskData.title || 'Untitled Task',
          description: taskData.description || taskData.title || '',
          tags: tags.length > 0 ? tags : ['general'],
          status: (taskData.status && STATUS_OPTIONS.includes(taskData.status)
            ? taskData.status
            : 'todo') as TaskStatus,
          priority: (taskData.priority || 'medium') as PriorityLevel,
          dueDate: validDueDate,
          timeSpent: 0,
        };
        
        await addTask(taskToSave);
      }
      
      // Reset
      setTranscript('');
      setInterimTranscript('');
      setExtractedTasks([]);
      setShowConfirmation(false);
      setAiMessage(null);
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
            <View style={[styles.processingCard, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
              <LinearGradient
                colors={isDarkMode ? ['#1e1b4b', '#312e81'] : ['#2563eb', '#1d4ed8']}
                style={styles.processingGradient}
              >
                <Animated.View style={[styles.processingGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
                <Animated.View style={[styles.processingRing, { transform: [{ rotate: spinnerRotation }] }]} />
                <View style={styles.processingCore}>
                  <Sparkles size={28} color="#ffffff" />
                </View>
              </LinearGradient>
              <View style={styles.processingCopy}>
                <Text style={[styles.processingTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>Organizing your tasks{processingDots}</Text>
                <Text style={[styles.processingSubtitle, { color: isDarkMode ? '#cbd5f5' : '#475569' }]}>
                  I’m reviewing the transcript, grouping similar intents, and preparing clean summaries.
                </Text>
                <View
                  style={[styles.processingSteps, {
                    borderColor: isDarkMode ? '#1e3a8a' : '#e2e8f0',
                    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                  }]}
                >
                  <View style={styles.processingStep}>
                    <View style={[styles.processingStepIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe' }]}>
                      <Mic size={16} color="#1d4ed8" />
                    </View>
                    <View style={styles.processingStepCopy}>
                      <Text style={[styles.processingStepTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>Context capture</Text>
                      <Text style={[styles.processingStepText, { color: isDarkMode ? '#cbd5f5' : '#475569' }]}>Identify services, actors, and constraints.</Text>
                    </View>
                  </View>
                  <View style={styles.processingStep}>
                    <View style={[styles.processingStepIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe' }]}>
                      <PenTool size={16} color="#1d4ed8" />
                    </View>
                    <View style={styles.processingStepCopy}>
                      <Text style={[styles.processingStepTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>Clarify wording</Text>
                      <Text style={[styles.processingStepText, { color: isDarkMode ? '#cbd5f5' : '#475569' }]}>Fix shorthand like “reverse” vs “driver”.</Text>
                    </View>
                  </View>
                  <View style={styles.processingStep}>
                    <View style={[styles.processingStepIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe' }]}>
                      <ListChecks size={16} color="#1d4ed8" />
                    </View>
                    <View style={styles.processingStepCopy}>
                      <Text style={[styles.processingStepTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>Draft tasks</Text>
                      <Text style={[styles.processingStepText, { color: isDarkMode ? '#cbd5f5' : '#475569' }]}>Create titles, descriptions, and due dates.</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
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

            {extractedTasks.length === 0 ? (
              <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksTitle}>No tasks yet</Text>
                <Text style={styles.noTasksMessage}>
                  {aiMessage || 'I did not find any developer tasks in that message. Try adding concrete implementation or bug details.'}
                </Text>
                <Text style={styles.noTasksHint}>Tap Try Again to record a new request.</Text>
              </View>
            ) : (
              <ScrollView style={styles.confirmationScroll} contentContainerStyle={styles.confirmationScrollContent} nestedScrollEnabled>
                {extractedTasks.map((task, index) => (
                  <View key={`extracted-${index}`} style={styles.extractedTask}>
                    <View style={styles.extractedTaskHeader}>
                      <Text style={styles.extractedTaskTitle}>Task {index + 1}</Text>
                      <Text style={styles.extractedTaskSubtitle}>Tap fields to edit before saving</Text>
                    </View>

                    <Text style={styles.editLabel}>Title</Text>
                    <TextInput
                      style={[styles.editableInput, { color: editableTextColor }]}
                      value={task.title}
                      onChangeText={(text) => updateExtractedTaskField(index, 'title', text)}
                    />

                    <Text style={styles.editLabel}>Description</Text>
                    <TextInput
                      style={[styles.editableInput, styles.editableInputMultiline, { color: editableTextColor }]}
                      value={task.description}
                      onChangeText={(text) => updateExtractedTaskField(index, 'description', text)}
                      multiline
                    />

                    <Text style={styles.editLabel}>Priority</Text>
                    <View style={styles.chipRow}>
                      {PRIORITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={`${option}-${index}`}
                          style={[styles.chip, task.priority === option && styles.chipActive]}
                          onPress={() => updateExtractedTaskField(index, 'priority', option)}
                        >
                          <Text style={[styles.chipText, task.priority === option && styles.chipTextActive]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.editLabel}>Status</Text>
                    <View style={styles.chipRow}>
                      {STATUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={`${option}-${index}`}
                          style={[styles.chip, task.status === option && styles.chipActive]}
                          onPress={() => updateExtractedTaskField(index, 'status', option)}
                        >
                          <Text style={[styles.chipText, task.status === option && styles.chipTextActive]}>
                            {option.replace('-', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.editLabel}>Due Date</Text>
                    <View style={styles.dueDateRow}>
                      <TouchableOpacity style={styles.dueDateButton} onPress={() => openDueDatePicker(index)}>
                        <Text style={[styles.dueDateButtonText, { color: editableTextColor }]}>
                          {formatDueDateDisplay(task.dueDate)}
                        </Text>
                      </TouchableOpacity>
                      {task.dueDate ? (
                        <TouchableOpacity style={styles.clearDateButton} onPress={() => clearDueDate(index)}>
                          <Text style={styles.clearDateButtonText}>Clear</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <Text style={styles.editLabel}>Tags (comma separated)</Text>
                    <TextInput
                      style={[styles.editableInput, { color: editableTextColor }]}
                      placeholder="e.g. auth, api, dashboard"
                      placeholderTextColor="#94a3b8"
                      value={task.tags.join(', ')}
                      onChangeText={(value) => updateExtractedTaskField(index, 'tags', value)}
                    />
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.tryAgainButton, { backgroundColor: isDarkMode ? '#e5e7eb' : '#ffffff' }]}
                onPress={() => {
                  setShowConfirmation(false);
                  setTranscript('');
                  setInterimTranscript('');
                  setExtractedTasks([]);
                  setAiMessage(null);
                }}
              >
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
              {extractedTasks.length > 0 && (
                <TouchableOpacity style={styles.confirmButton} onPress={confirmTasks}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
      {showIosDatePicker && (
        <Modal transparent animationType="fade" visible={showIosDatePicker} onRequestClose={closeIosDatePicker}>
          <View style={styles.datePickerOverlay}>
            <View style={[styles.datePickerContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }]}>
              <DateTimePicker
                mode="date"
                value={iosPickerDate}
                display="spinner"
                onChange={handleIosDateChange}
                style={styles.iosPicker}
              />
              <TouchableOpacity style={styles.closeDatePickerButton} onPress={closeIosDatePicker}>
                <Text style={styles.closeDatePickerText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  processingCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#f8fafc',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 24,
  },
  processingGradient: {
    borderRadius: 24,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  processingGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  processingRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
  },
  processingCore: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCopy: {
    marginTop: 20,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  processingSteps: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
  },
  processingStep: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
    gap: 12,
  },
  processingStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingStepCopy: {
    flex: 1,
  },
  processingStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  processingStepText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  confirmationScroll: {
    maxHeight: 360,
  },
  confirmationScrollContent: {
    paddingBottom: 12,
  },
  noTasksContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 20,
  },
  noTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  noTasksMessage: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
    marginBottom: 8,
  },
  noTasksHint: {
    fontSize: 13,
    color: '#1d4ed8',
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
  extractedTaskSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  editableInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  editableInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dueDateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
  },
  dueDateButtonText: {
    fontSize: 14,
  },
  clearDateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  clearDateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
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
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  datePickerContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
  },
  iosPicker: {
    width: '100%',
  },
  closeDatePickerButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  closeDatePickerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
