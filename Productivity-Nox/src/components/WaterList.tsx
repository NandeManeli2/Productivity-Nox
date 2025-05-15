import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getWaterLogs,
  deleteWaterLog,
  subscribeToChanges,
} from '../services/supabase';
import { WaterLog } from '../types';
import { format } from 'date-fns';

const WaterList: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initial load
    loadWaterLogs();

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('water_logs', (payload) => {
      if (payload.eventType === 'INSERT') {
        setLogs(prev => [payload.new as WaterLog, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setLogs(prev =>
          prev.map(log =>
            log.id === payload.new.id ? (payload.new as WaterLog) : log
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setLogs(prev => prev.filter(log => log.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadWaterLogs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getWaterLogs(user.id);
      setLogs(data);
    } catch (err) {
      setError('Failed to load water logs');
      console.error('Error loading water logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteWaterLog(logId);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete water log');
      console.error('Error deleting water log:', err);
    }
  };

  const renderLog = ({ item: log }: { item: WaterLog }) => (
    <View
      style={[
        styles.logItem,
        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
      ]}
    >
      <View style={styles.logContent}>
        <Text
          style={[
            styles.logAmount,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          {log.amount} ml
        </Text>
        <Text
          style={[
            styles.logTime,
            { color: isDark ? '#999999' : '#999999' },
          ]}
        >
          {format(new Date(log.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteLog(log.id)}
      >
        <Text style={{ color: '#E74C3C' }}>×</Text>
      </TouchableOpacity>
    </View>
  );

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
          onPress={loadWaterLogs}
        >
          <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      renderItem={renderLog}
      keyExtractor={log => log.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  logContent: {
    flex: 1,
  },
  logAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
});

export default WaterList; 