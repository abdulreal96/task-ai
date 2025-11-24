import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, BarChart3, Settings } from 'lucide-react-native';
import { TaskProvider } from './src/context/TaskContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import DashboardScreen from './src/screens/DashboardScreen';
import TaskBoardScreen from './src/screens/TaskBoardScreen';
import RecordTaskScreen from './src/screens/RecordTaskScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          headerShown: false,
        }}
      >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Home color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="TaskBoard"
            component={TaskBoardScreen}
            options={{
              tabBarLabel: 'Tasks',
              tabBarIcon: ({ color, size }) => (
                <CheckSquare color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="RecordTask"
            component={RecordTaskScreen}
            options={{
              tabBarLabel: 'Record',
              tabBarIcon: ({ color, size }) => (
                <CheckSquare color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <BarChart3 color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Settings color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TaskProvider>
        <AppNavigator />
      </TaskProvider>
    </ThemeProvider>
  );
}
