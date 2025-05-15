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
  getMeals,
  deleteTask,
  subscribeToChanges,
} from '../services/supabase';
import { Meal } from '../types';
import { format } from 'date-fns';

const MealList: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initial load
    loadMeals();

    // Subscribe to real-time updates
    const subscription = subscribeToChanges('meals', (payload) => {
      if (payload.eventType === 'INSERT') {
        setMeals(prev => [payload.new as Meal, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setMeals(prev =>
          prev.map(meal =>
            meal.id === payload.new.id ? (payload.new as Meal) : meal
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setMeals(prev => prev.filter(meal => meal.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadMeals = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMeals(user.id);
      setMeals(data);
    } catch (err) {
      setError('Failed to load meals');
      console.error('Error loading meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteTask(mealId);
    } catch (err) {
      Alert.alert('Error', 'Failed to delete meal');
      console.error('Error deleting meal:', err);
    }
  };

  const renderMeal = ({ item: meal }: { item: Meal }) => (
    <View
      style={[
        styles.mealItem,
        { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
      ]}
    >
      <View style={styles.mealContent}>
        <Text
          style={[
            styles.mealName,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          {meal.name}
        </Text>
        <Text
          style={[
            styles.mealCalories,
            { color: isDark ? '#CCCCCC' : '#666666' },
          ]}
        >
          {meal.calories} calories
        </Text>
        <Text
          style={[
            styles.mealTime,
            { color: isDark ? '#999999' : '#999999' },
          ]}
        >
          {format(new Date(meal.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteMeal(meal.id)}
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
          onPress={loadMeals}
        >
          <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={meals}
      renderItem={renderMeal}
      keyExtractor={meal => meal.id}
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
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    marginBottom: 2,
  },
  mealTime: {
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

export default MealList; 