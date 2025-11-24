import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Mic, Palette, Download, Info, ChevronRight, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { isDarkMode, colorScheme, toggleDarkMode, setColorScheme, colors } = useTheme();
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(false);
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorSchemes = [
    { name: 'Blue', value: 'blue' as const, color: '#2563eb' },
    { name: 'Purple', value: 'purple' as const, color: '#9333ea' },
    { name: 'Green', value: 'green' as const, color: '#16a34a' },
    { name: 'Orange', value: 'orange' as const, color: '#ea580c' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Customize your experience</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Voice Recognition */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mic size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Recognition</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-confirm tasks</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Skip confirmation dialog</Text>
              </View>
              <Switch
                value={autoConfirm}
                onValueChange={setAutoConfirm}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={autoConfirm ? colors.primary : '#f3f4f6'}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Voice feedback</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Hear AI responses</Text>
              </View>
              <Switch
                value={voiceFeedback}
                onValueChange={setVoiceFeedback}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={voiceFeedback ? colors.primary : '#f3f4f6'}
              />
            </View>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>English (US)</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Daily summary</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Get daily productivity report</Text>
              </View>
              <Switch
                value={dailySummary}
                onValueChange={setDailySummary}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={dailySummary ? colors.primary : '#f3f4f6'}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Weekly report</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Weekly productivity insights</Text>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={setWeeklyReport}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={weeklyReport ? colors.primary : '#f3f4f6'}
              />
            </View>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Task reminders</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Remind about pending tasks</Text>
              </View>
              <Switch
                value={taskReminders}
                onValueChange={setTaskReminders}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={taskReminders ? colors.primary : '#f3f4f6'}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>AI insights</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Get smart suggestions</Text>
              </View>
              <Switch
                value={aiInsights}
                onValueChange={setAiInsights}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={aiInsights ? colors.primary : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Dark mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Use dark theme</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#d1d5db', true: colors.primaryLight }}
                thumbColor={isDarkMode ? colors.primary : '#f3f4f6'}
              />
            </View>
            <TouchableOpacity style={styles.settingItem} onPress={() => setShowColorPicker(true)}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Color scheme</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {colorSchemes.find(c => c.value === colorScheme)?.name}
                </Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Privacy</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Export data</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Download all your tasks</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Clear cache</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Free up storage space</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, styles.dangerText]}>Delete account</Text>
                <Text style={[styles.settingDescription, styles.dangerTextLight]}>
                  Permanently delete all data
                </Text>
              </View>
              <ChevronRight size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          </View>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Version</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>1.0.0</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Terms of Service</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.signOutText, { color: colors.text }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Color Scheme</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.colorOptions}>
              {colorSchemes.map((scheme) => (
                <TouchableOpacity
                  key={scheme.value}
                  style={[styles.colorOption, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setColorScheme(scheme.value);
                    setShowColorPicker(false);
                  }}
                >
                  <View style={[styles.colorCircle, { backgroundColor: scheme.color }]} />
                  <Text style={[styles.colorName, { color: colors.text }]}>{scheme.name}</Text>
                  {colorScheme === scheme.value && (
                    <Check size={20} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  dangerText: {
    color: '#ef4444',
  },
  dangerTextLight: {
    color: '#f87171',
  },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  colorOptions: {
    gap: 12,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorName: {
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
