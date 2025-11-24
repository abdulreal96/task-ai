import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Mic, Palette, Download, Info, ChevronRight, Check } from 'lucide-react-native';
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
            <Mic size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Voice Recognition</Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-confirm tasks</Text>
                <Text style={styles.settingDescription}>Skip confirmation dialog</Text>
              </View>
              <Switch
                value={autoConfirm}
                onValueChange={setAutoConfirm}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={autoConfirm ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Voice feedback</Text>
                <Text style={styles.settingDescription}>Hear AI responses</Text>
              </View>
              <Switch
                value={voiceFeedback}
                onValueChange={setVoiceFeedback}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={voiceFeedback ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Language</Text>
                <Text style={styles.settingDescription}>English (US)</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Daily summary</Text>
                <Text style={styles.settingDescription}>Get daily productivity report</Text>
              </View>
              <Switch
                value={dailySummary}
                onValueChange={setDailySummary}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={dailySummary ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Weekly report</Text>
                <Text style={styles.settingDescription}>Weekly productivity insights</Text>
              </View>
              <Switch
                value={weeklyReport}
                onValueChange={setWeeklyReport}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={weeklyReport ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Task reminders</Text>
                <Text style={styles.settingDescription}>Remind about pending tasks</Text>
              </View>
              <Switch
                value={taskReminders}
                onValueChange={setTaskReminders}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={taskReminders ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>AI insights</Text>
                <Text style={styles.settingDescription}>Get smart suggestions</Text>
              </View>
              <Switch
                value={aiInsights}
                onValueChange={setAiInsights}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={aiInsights ? '#2563eb' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Appearance</Text>
          </View>

          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={darkMode ? '#2563eb' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Color scheme</Text>
                <Text style={styles.settingDescription}>Blue</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={20} color="#111827" />
            <Text style={styles.sectionTitle}>Data & Privacy</Text>
          </View>

          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Export data</Text>
                <Text style={styles.settingDescription}>Download all your tasks</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Clear cache</Text>
                <Text style={styles.settingDescription}>Free up storage space</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: '#dc2626' }]}>Delete account</Text>
                <Text style={[styles.settingDescription, { color: '#f87171' }]}>
                  Permanently delete all data
                </Text>
              </View>
              <ChevronRight size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#111827" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});
