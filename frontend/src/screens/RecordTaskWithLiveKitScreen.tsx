import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Mic, MicOff, X } from 'lucide-react-native';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import liveKitService, { ExtractedTask, TranscriptMessage } from '../services/livekit';

type ConversationEntry = TranscriptMessage & { id: string };

const MAX_CONVERSATION_MESSAGES = 60;

const mergeConversationMessages = (
  previous: ConversationEntry[],
  incoming: TranscriptMessage,
): ConversationEntry[] => {
  if (!incoming?.text?.trim()) {
    return previous;
  }

  const normalized = incoming.text.trim();
  const updated = [...previous];
  const lastIndex = updated.length - 1;
  const lastItem = lastIndex >= 0 ? updated[lastIndex] : undefined;

  if (lastItem && lastItem.speaker === incoming.speaker && !lastItem.isFinal) {
    updated[lastIndex] = {
      ...lastItem,
      text: normalized,
      isFinal: incoming.isFinal ?? lastItem.isFinal,
      timestamp: incoming.timestamp,
    };
  } else {
    updated.push({
      ...incoming,
      text: normalized,
      id: `${incoming.speaker}-${incoming.timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    });
  }

  while (updated.length > MAX_CONVERSATION_MESSAGES) {
    updated.shift();
  }

  return updated;
};

const formatDueDateLabel = (dueDate?: string) => {
  const value = dueDate ? new Date(dueDate) : new Date();
  return value.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

const priorityChipColors = (priority: ExtractedTask['priority']) => {
  switch (priority) {
    case 'high':
      return { bg: '#fee2e2', text: '#991b1b' };
    case 'medium':
      return { bg: '#fef3c7', text: '#92400e' };
    default:
      return { bg: '#dbeafe', text: '#1e3a8a' };
  }
};

const projectLabel = (project?: string) => project?.trim() || 'Voice Assistant';

export default function RecordTaskWithLiveKitScreen({ navigation }: any) {
  const { addTask } = useTasks();
  const { colors, isDarkMode } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [status, setStatus] = useState('Ready to connect');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const conversationRef = useRef<ScrollView>(null);
  const waveAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const waveTranslate = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const reverseWaveTranslate = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [-80, 40] });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  useEffect(() => {
    liveKitService.onTranscript((message) => {
      setConversation((prev) => mergeConversationMessages(prev, message));
    });

    liveKitService.onTasksExtracted((tasks) => {
      setExtractedTasks(tasks);
      setShowConfirmation(true);
    });

    liveKitService.onStatusChange((newStatus) => setStatus(newStatus));

    return () => {
      liveKitService.onTranscript(null);
      liveKitService.onTasksExtracted(null);
      liveKitService.onStatusChange(null);
      if (liveKitService.isConnected()) {
        liveKitService.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (conversation.length > 0) {
      conversationRef.current?.scrollToEnd({ animated: true });
    }
  }, [conversation]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [waveAnim, pulseAnim]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setStatus('Connecting to AI...');

      const roomName = `task-room-${Date.now()}`;
      const participantName = 'User';

      await liveKitService.connect({ roomName, participantName });

      setIsConnected(true);
      setStatus('Connected - Start speaking');
      setIsConnecting(false);
      setConversation([]);
      setExtractedTasks([]);
      setShowConfirmation(false);
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
      setConversation([]);
      setExtractedTasks([]);
      setShowConfirmation(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const handleConfirmTasks = async () => {
    try {
      await liveKitService.confirmTasks(true);

      for (const task of extractedTasks) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
        const taskPayload: any = {
          title: task.title,
          description: task.description || '',
          priority: (task.priority || 'medium') as any,
          dueDate,
          status: 'todo',
          timeSpent: 0,
          projectName: projectLabel(task.project),
        };

        await addTask(taskPayload);
      }

      Alert.alert('Success', `${extractedTasks.length} task(s) created successfully`);
      setExtractedTasks([]);
      setShowConfirmation(false);
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
    } catch (error: any) {
      Alert.alert('Error', 'Failed to reject tasks');
    }
  };

  const sessionStateLabel = isConnected ? 'Assistant is live' : 'Ready when you are';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      <View style={styles.backgroundLayer} pointerEvents="none">
        <Animated.View style={[styles.wave, { transform: [{ translateX: waveTranslate }] }]}>
          <LinearGradient colors={['rgba(79,70,229,0.35)', 'transparent']} style={styles.waveGradient} />
        </Animated.View>
        <Animated.View style={[styles.wave, styles.waveAlt, { transform: [{ translateX: reverseWaveTranslate }] }]}>
          <LinearGradient colors={['rgba(14,165,233,0.25)', 'transparent']} style={styles.waveGradient} />
        </Animated.View>
      </View>

      <View style={styles.overlay}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Voice Assistant</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.sessionCard, { backgroundColor: colors.surface + 'F0', borderColor: colors.border + '55' }]}>
            <View style={styles.sessionDetails}>
              <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>{sessionStateLabel}</Text>
              <Text style={[styles.sessionStatus, { color: colors.text }]}>{status}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.liveDot, isConnected ? styles.liveDotActive : null]} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {isConnected ? 'Streaming transcript' : 'Offline'}
                </Text>
              </View>
            </View>
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
              <View style={[styles.micCore, { backgroundColor: colors.primary }]}>
                <Mic size={28} color="#fff" />
              </View>
            </View>
          </View>

          <View style={[styles.conversationCard, { backgroundColor: colors.surface + 'F8', borderColor: colors.border + '33' }]}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Conversation Stream</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {conversation.length > 0 ? 'Live captions' : 'Say something to begin'}
              </Text>
            </View>
            <ScrollView
              ref={conversationRef}
              style={styles.conversationScroll}
              contentContainerStyle={styles.conversationContent}
              showsVerticalScrollIndicator={false}
            >
              {conversation.length === 0 ? (
                <Text style={[styles.emptyTranscript, { color: colors.textSecondary }]}>
                  Speak naturally and every turn will flow through here.
                </Text>
              ) : (
                conversation.map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.messageBubble,
                      entry.speaker === 'user' ? styles.userBubble : styles.agentBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageLabel,
                        entry.speaker === 'user' ? styles.userLabel : styles.agentLabel,
                      ]}
                    >
                      {entry.speaker === 'user' ? 'You' : 'Agent'}
                    </Text>
                    <Text style={[styles.messageText, { color: colors.text }]}>{entry.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {showConfirmation ? (
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border + '44' }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Generated tasks</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {extractedTasks.length} ready for review
                </Text>
              </View>
              <View style={styles.generatedTasks}>
                {extractedTasks.map((task, index) => {
                  const chip = priorityChipColors(task.priority);
                  return (
                    <View
                      key={`${task.title}-${index}`}
                      style={[styles.generatedTaskCard, { borderColor: colors.border + '44' }]}
                    >
                      <View style={styles.generatedTaskHeader}>
                        <View style={[styles.metaPill, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.metaPillText, { color: colors.primary }]}>{projectLabel(task.project)}</Text>
                        </View>
                        <View style={[styles.priorityChip, { backgroundColor: chip.bg }]}>
                          <Text style={[styles.priorityChipText, { color: chip.text }]}>{task.priority}</Text>
                        </View>
                      </View>
                      <Text style={[styles.generatedTaskTitle, { color: colors.text }]}>{task.title}</Text>
                      {task.description && (
                        <Text style={[styles.generatedTaskDescription, { color: colors.textSecondary }]}>
                          {task.description}
                        </Text>
                      )}
                      <View style={styles.generatedMetaRow}>
                        <View style={[styles.metaPill, { backgroundColor: colors.border + '33' }]}>
                          <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>Due {formatDueDateLabel(task.dueDate)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.reviewActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={handleRejectTasks}
                >
                  <X size={18} color={colors.text} />
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Adjust</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleConfirmTasks}
                >
                  <Check size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Save tasks</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              {!isConnected ? (
                <TouchableOpacity
                  style={[styles.primaryButtonLarge, { backgroundColor: colors.primary }]}
                  onPress={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Mic size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Start conversation</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.secondaryButtonFull, { borderColor: colors.border }]}
                  onPress={handleDisconnect}
                >
                  <MicOff size={18} color={colors.text} />
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>End session</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: '160%',
    height: 260,
    top: 0,
    left: '-30%',
  },
  waveAlt: {
    top: 120,
    opacity: 0.8,
  },
  waveGradient: {
    flex: 1,
  },
  overlay: {
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
    padding: 20,
    gap: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  sessionDetails: {
    flex: 1,
    paddingRight: 12,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionStatus: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9ca3af',
  },
  liveDotActive: {
    backgroundColor: '#22c55e',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pulseContainer: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#a5b4fc',
  },
  micCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    minHeight: 220,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
  },
  conversationScroll: {
    maxHeight: 260,
  },
  conversationContent: {
    gap: 12,
    paddingBottom: 4,
  },
  emptyTranscript: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#eef2ff',
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdfa',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  userLabel: {
    color: '#4338ca',
  },
  agentLabel: {
    color: '#0f766e',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 16,
  },
  generatedTasks: {
    gap: 12,
  },
  generatedTaskCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  generatedTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  generatedTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  generatedTaskDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  generatedMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 4,
  },
});
