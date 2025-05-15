import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getWaterLogs, getUserPreferences } from '../services/supabase';
import { WaterLog, UserPreferences } from '../types';
import { startOfDay, endOfDay } from 'date-fns';

const DEFAULT_GOAL = 2000; // Default goal in ml

const WaterSummary: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayIntake, setTodayIntake] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      // Get user preferences for water goal
      const preferences = await getUserPreferences(user.id);
      if (preferences?.water_goal) {
        setGoal(preferences.water_goal);
      }

      // Get today's water logs
      const today = new Date();
      const logs = await getWaterLogs(user.id);
      const todayLogs = logs.filter(
        log =>
          new Date(log.created_at) >= startOfDay(today) &&
          new Date(log.created_at) <= endOfDay(today)
      );

      const total = todayLogs.reduce((sum, log) => sum + log.amount, 0);
      setTodayIntake(total);
    } catch (err) {
      setError('Failed to load water summary');
      console.error('Error loading water summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.min((todayIntake / goal) * 100, 100);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: '#E74C3C' }}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          onPress={loadData}
        >
          <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? '#FFFFFF' : '#000000' },
        ]}
      >
        Today's Water Intake
      </Text>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: isDark ? '#333333' : '#E0E0E0',
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isDark ? '#3498DB' : '#2980B9',
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.progressText,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          {todayIntake} / {goal} ml
        </Text>
      </View>
      <Text
        style={[
          styles.percentage,
          { color: isDark ? '#CCCCCC' : '#666666' },
        ]}
      >
        {Math.round(progress)}% of daily goal
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  percentage: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
});

export default WaterSummary; 