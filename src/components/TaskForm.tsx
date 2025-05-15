import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createTask } from '../services/supabase';

interface TaskFormProps {
  onTaskAdded?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onTaskAdded }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add tasks');
      return;
    }

    try {
      setLoading(true);
      await createTask({
        user_id: user.id,
        title: title.trim(),
        completed: false,
      });
      setTitle('');
      onTaskAdded?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to create task');
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#000000',
            borderColor: isDark ? '#333333' : '#E0E0E0',
          },
        ]}
        placeholder="Add a new task..."
        placeholderTextColor={isDark ? '#666666' : '#999999'}
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        editable={!loading}
      />
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDark ? '#4CAF50' : '#2ECC71',
            opacity: loading ? 0.7 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Adding...' : 'Add Task'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskForm; 