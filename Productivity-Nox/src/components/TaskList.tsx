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
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  subscribeToChanges,
} from '../services/supabase';
import { Task } from '../types';

const TaskList: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initial load
    loadTasks();

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('tasks', (payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [payload.new as Task, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev =>
          prev.map(task =>
            task.id === payload.new.id ? (payload.new as Task) : task
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks(user.id);
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const renderTask = ({ item: task }: { item: Task }) => (
    <View
      style={[
        styles.taskItem,
        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
      ]}
    >
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => handleToggleTask(task)}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: task.completed
                ? isDark
                  ? '#4CAF50'
                  : '#2ECC71'
                : 'transparent',
              borderColor: isDark ? '#FFFFFF' : '#000000',
            },
          ]}
        />
        <Text
          style={[
            styles.taskText,
            {
              color: isDark ? '#FFFFFF' : '#000000',
              textDecorationLine: task.completed ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(task.id)}
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
          onPress={loadTasks}
        >
          <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      renderItem={renderTask}
      keyExtractor={task => task.id}
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
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

export default TaskList; 