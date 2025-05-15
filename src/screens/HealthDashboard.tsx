import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Animated,
  TextInput,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getWaterLogs, getMeals, updateUserPreferences, getUserPreferences } from '../services/supabase';
import { WaterLog, Meal, UserPreferences } from '../types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ChartTooltip {
  visible: boolean;
  x: number;
  y: number;
  value: number;
  label: string;
}

const HealthDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [waterData, setWaterData] = useState<WaterLog[]>([]);
  const [mealData, setMealData] = useState<Meal[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [waterTooltip, setWaterTooltip] = useState<ChartTooltip>({ visible: false, x: 0, y: 0, value: 0, label: '' });
  const [calorieTooltip, setCalorieTooltip] = useState<ChartTooltip>({ visible: false, x: 0, y: 0, value: 0, label: '' });
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    daily_water_goal: 2000,
    daily_calorie_goal: 2000,
    notifications_enabled: true,
  });
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, selectedPeriod]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = selectedPeriod === 'week' 
        ? subDays(endDate, 7)
        : subDays(endDate, 30);

      // Load water logs
      const waterLogs = await getWaterLogs(user.id);
      const filteredWaterLogs = waterLogs.filter(
        log => new Date(log.created_at) >= startDate && new Date(log.created_at) <= endDate
      );
      setWaterData(filteredWaterLogs);

      // Load meals
      const meals = await getMeals(user.id);
      const filteredMeals = meals.filter(
        meal => new Date(meal.created_at) >= startDate && new Date(meal.created_at) <= endDate
      );
      setMealData(filteredMeals);

      // Load user preferences
      const prefs = await getUserPreferences(user.id);
      if (prefs) {
        setUserPreferences(prefs);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWaterChartPress = (data: any) => {
    if (data && data.x && data.y && data.value) {
      setWaterTooltip({
        visible: true,
        x: data.x,
        y: data.y,
        value: data.value,
        label: data.label,
      });
    }
  };

  const handleCalorieChartPress = (data: any) => {
    if (data && data.x && data.y && data.value) {
      setCalorieTooltip({
        visible: true,
        x: data.x,
        y: data.y,
        value: data.value,
        label: data.label,
      });
    }
  };

  const handleZoomIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const calculateDailyTotals = () => {
    const today = new Date();
    const todayWater = waterData
      .filter(log => new Date(log.created_at).toDateString() === today.toDateString())
      .reduce((sum, log) => sum + log.amount, 0);

    const todayCalories = mealData
      .filter(meal => new Date(meal.created_at).toDateString() === today.toDateString())
      .reduce((sum, meal) => sum + meal.calories, 0);

    const waterProgress = (todayWater / userPreferences.daily_water_goal) * 100;
    const calorieProgress = (todayCalories / userPreferences.daily_calorie_goal) * 100;

    return { 
      water: todayWater, 
      calories: todayCalories,
      waterProgress: Math.min(waterProgress, 100),
      calorieProgress: Math.min(calorieProgress, 100),
    };
  };

  const prepareChartData = () => {
    const days = selectedPeriod === 'week' ? 7 : 30;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      return format(date, 'MMM d');
    });

    const waterValues = labels.map(label => {
      const date = new Date(label);
      return waterData
        .filter(log => new Date(log.created_at).toDateString() === date.toDateString())
        .reduce((sum, log) => sum + log.amount, 0);
    });

    const calorieValues = labels.map(label => {
      const date = new Date(label);
      return mealData
        .filter(meal => new Date(meal.created_at).toDateString() === date.toDateString())
        .reduce((sum, meal) => sum + meal.calories, 0);
    });

    return { labels, waterValues, calorieValues };
  };

  const { labels, waterValues, calorieValues } = prepareChartData();
  const { water, calories, waterProgress, calorieProgress } = calculateDailyTotals();

  const chartConfig = {
    backgroundGradientFrom: isDark ? '#1A1A1A' : '#FFFFFF',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#FFFFFF',
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'week' && styles.selectedPeriod,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={[
              styles.periodText,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'month' && styles.selectedPeriod,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={[
              styles.periodText,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.goalsButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          onPress={() => setShowGoalsModal(true)}
        >
          <Ionicons name="settings-outline" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>

      {/* Today's Summary */}
      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Today's Summary
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <View style={styles.progressCircle}>
              <Text
                style={[
                  styles.progressText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {Math.round(waterProgress)}%
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              {water} / {userPreferences.daily_water_goal} ml
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                { color: isDark ? '#CCCCCC' : '#666666' },
              ]}
            >
              Water Intake
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={styles.progressCircle}>
              <Text
                style={[
                  styles.progressText,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {Math.round(calorieProgress)}%
              </Text>
            </View>
            <Text
              style={[
                styles.summaryValue,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              {calories} / {userPreferences.daily_calorie_goal} cal
            </Text>
            <Text
              style={[
                styles.summaryLabel,
                { color: isDark ? '#CCCCCC' : '#666666' },
              ]}
            >
              Calories
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Controls */}
      <View style={styles.chartControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          onPress={handleZoomIn}
        >
          <Ionicons name="add" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
          onPress={handleZoomOut}
        >
          <Ionicons name="remove" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>

      {/* Water Intake Chart */}
      <Animated.View
        style={[
          styles.chartContainer,
          { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.chartTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Water Intake Trend
        </Text>
        <LineChart
          data={{
            labels,
            datasets: [{ data: waterValues }],
          }}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Animated.View>

      {/* Calorie Intake Chart */}
      <Animated.View
        style={[
          styles.chartContainer,
          { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.chartTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Calorie Intake Trend
        </Text>
        <BarChart
          data={{
            labels,
            datasets: [{ data: calorieValues }],
          }}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=" cal"
        />
      </Animated.View>

      {/* Goals Modal */}
      <Modal
        visible={showGoalsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              Set Daily Goals
            </Text>
            <View style={styles.goalInput}>
              <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                Daily Water Goal (ml)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                  { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
                ]}
                value={userPreferences.daily_water_goal.toString()}
                onChangeText={(text) =>
                  setUserPreferences({
                    ...userPreferences,
                    daily_water_goal: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
              />
            </View>
            <View style={styles.goalInput}>
              <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                Daily Calorie Goal
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                  { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
                ]}
                value={userPreferences.daily_calorie_goal.toString()}
                onChangeText={(text) =>
                  setUserPreferences({
                    ...userPreferences,
                    daily_calorie_goal: parseInt(text) || 0,
                  })
                }
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                if (user) {
                  await updateUserPreferences(user.id, userPreferences);
                  setShowGoalsModal(false);
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedPeriod: {
    backgroundColor: '#3498DB',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalsButton: {
    padding: 8,
    borderRadius: 20,
  },
  summaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  tooltip: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  goalInput: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#3498DB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HealthDashboard; 