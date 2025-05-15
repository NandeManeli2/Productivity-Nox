import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../services/analytics';
import { supabase } from '../services/supabase';
import { format, subDays, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { LineChart, BarChart, PieChart, StackedBarChart } from 'react-native-chart-kit';

interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  created_at: string;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  timestamp: string;
  properties?: Record<string, any>;
}

interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  totalMeals: number;
  totalCalories: number;
  screenViews: { [key: string]: number };
  recentEvents: AnalyticsEvent[];
  dailyStats: {
    date: string;
    tasks: number;
    completedTasks: number;
    meals: number;
    calories: number;
  }[];
}

interface ChartTooltip {
  visible: boolean;
  x: number;
  y: number;
  value: number;
  label: string;
  details?: {
    tasks?: number;
    completedTasks?: number;
    meals?: number;
    calories?: number;
  };
}

const DATE_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(7);
  const [tooltip, setTooltip] = useState<ChartTooltip>({
    visible: false,
    x: 0,
    y: 0,
    value: 0,
    label: '',
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalTasks: 0,
    completedTasks: 0,
    totalMeals: 0,
    totalCalories: 0,
    screenViews: {},
    recentEvents: [],
    dailyStats: [],
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  useEffect(() => {
    analytics.trackScreenView('Analytics');
    fetchAnalytics();
  }, [selectedRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const startDate = startOfDay(subDays(new Date(), selectedRange));
      const endDate = endOfDay(new Date());

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch meals
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch recent events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false });

      // Calculate daily statistics
      const dailyStats = Array.from({ length: selectedRange }, (_, i) => {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTasks = (tasks as Task[])?.filter(
          (task: Task) => format(new Date(task.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];
        const dayMeals = (meals as Meal[])?.filter(
          (meal: Meal) => format(new Date(meal.created_at), 'yyyy-MM-dd') === dateStr
        ) || [];

        return {
          date: dateStr,
          tasks: dayTasks.length,
          completedTasks: dayTasks.filter((task: Task) => task.completed).length,
          meals: dayMeals.length,
          calories: dayMeals.reduce((sum: number, meal: Meal) => sum + meal.calories, 0),
        };
      }).reverse();

      // Calculate screen views
      const screenViews = (events as AnalyticsEvent[])?.reduce((acc: { [key: string]: number }, event: AnalyticsEvent) => {
        if (event.event_type === 'screen_viewed') {
          const screenName = event.properties?.screenName as string;
          acc[screenName] = (acc[screenName] || 0) + 1;
        }
        return acc;
      }, {});

      setSummary({
        totalTasks: (tasks as Task[])?.length || 0,
        completedTasks: (tasks as Task[])?.filter((task: Task) => task.completed).length || 0,
        totalMeals: (meals as Meal[])?.length || 0,
        totalCalories: (meals as Meal[])?.reduce((sum: number, meal: Meal) => sum + meal.calories, 0) || 0,
        screenViews: screenViews || {},
        recentEvents: events as AnalyticsEvent[] || [],
        dailyStats,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = {
        summary,
        exportDate: new Date().toISOString(),
        dateRange: `${selectedRange} days`,
      };

      const csvContent = [
        ['Date', 'Tasks', 'Completed Tasks', 'Meals', 'Calories'],
        ...summary.dailyStats.map(stat => [
          stat.date,
          stat.tasks,
          stat.completedTasks,
          stat.meals,
          stat.calories,
        ]),
      ]
        .map(row => row.join(','))
        .join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      } else {
        await Share.share({
          message: csvContent,
          title: 'Analytics Export',
        });
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: isDark ? '#000000' : '#FFFFFF',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#F5F5F5',
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const handleChartPress = (data: { value: number; index: number }) => {
    const date = summary.dailyStats[data.index].date;
    setSelectedDate(date);
  };

  const handleZoom = (scale: number) => {
    setZoomLevel(Math.max(1, Math.min(3, scale)));
  };

  const handlePan = (x: number, y: number) => {
    setPanOffset({ x, y });
  };

  const renderDateDetails = () => {
    if (!selectedDate) return null;

    const dayStats = summary.dailyStats.find(stat => stat.date === selectedDate);
    if (!dayStats) return null;

    return (
      <Modal
        visible={!!selectedDate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }]}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </Text>
            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {dayStats.tasks}
                </Text>
                <Text style={[styles.modalStatLabel, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                  Total Tasks
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {dayStats.completedTasks}
                </Text>
                <Text style={[styles.modalStatLabel, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                  Completed Tasks
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {dayStats.meals}
                </Text>
                <Text style={[styles.modalStatLabel, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                  Meals
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {dayStats.calories}
                </Text>
                <Text style={[styles.modalStatLabel, { color: isDark ? '#CCCCCC' : '#666666' }]}>
                  Calories
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? '#FFFFFF' : '#000000' }]}
              onPress={() => setSelectedDate(null)}
            >
              <Text style={[styles.closeButtonText, { color: isDark ? '#000000' : '#FFFFFF' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTaskCompletionChart = () => {
    const data = {
      labels: summary.dailyStats.map(stat => format(new Date(stat.date), 'MMM d')),
      datasets: [
        {
          data: summary.dailyStats.map(stat => stat.completedTasks),
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Task Completion Trend
        </Text>
        <Animated.View
          style={[
            styles.chartWrapper,
            {
              transform: [
                { scale: scale },
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <LineChart
            data={data}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            onDataPointClick={({ value, index, x, y }) => {
              const dayStats = summary.dailyStats[index];
              setTooltip({
                visible: true,
                x,
                y,
                value,
                label: format(new Date(dayStats.date), 'MMM d'),
                details: {
                  tasks: dayStats.tasks,
                  completedTasks: dayStats.completedTasks,
                  meals: dayStats.meals,
                  calories: dayStats.calories,
                },
              });
            }}
            decorator={() => {
              return tooltip.visible ? (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: tooltip.x,
                      top: tooltip.y,
                      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                    },
                  ]}
                >
                  <Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>
                    {tooltip.label}
                  </Text>
                  <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                    {tooltip.value} tasks completed
                  </Text>
                  {tooltip.details && (
                    <>
                      <Text style={{ color: isDark ? '#CCCCCC' : '#666666' }}>
                        Total Tasks: {tooltip.details.tasks}
                      </Text>
                      <Text style={{ color: isDark ? '#CCCCCC' : '#666666' }}>
                        Meals: {tooltip.details.meals}
                      </Text>
                      <Text style={{ color: isDark ? '#CCCCCC' : '#666666' }}>
                        Calories: {tooltip.details.calories}
                      </Text>
                    </>
                  )}
                </View>
              ) : null;
            }}
          />
        </Animated.View>
        <View style={styles.chartControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
            onPress={() => handleZoom(zoomLevel + 0.5)}
          >
            <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
            onPress={() => handleZoom(zoomLevel - 0.5)}
          >
            <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}
            onPress={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              pan.setValue({ x: 0, y: 0 });
              scale.setValue(1);
            }}
          >
            <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCaloriesChart = () => {
    const data = {
      labels: summary.dailyStats.map(stat => format(new Date(stat.date), 'MMM d')),
      datasets: [
        {
          data: summary.dailyStats.map(stat => stat.calories),
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Daily Calories
        </Text>
        <BarChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
          yAxisLabel=""
          yAxisSuffix=" cal"
          fromZero
        />
      </View>
    );
  };

  const renderTaskDistributionChart = () => {
    const totalTasks = summary.totalTasks;
    const completedTasks = summary.completedTasks;
    const pendingTasks = totalTasks - completedTasks;

    const data = [
      {
        name: 'Completed',
        population: completedTasks,
        color: '#2ECC71',
        legendFontColor: isDark ? '#FFFFFF' : '#000000',
      },
      {
        name: 'Pending',
        population: pendingTasks,
        color: '#E74C3C',
        legendFontColor: isDark ? '#FFFFFF' : '#000000',
      },
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Task Distribution
        </Text>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
          hasLegend
          center={[(screenWidth - 40) / 2, 110]}
          absolute
        />
      </View>
    );
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
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Analytics
        </Text>
        <TouchableOpacity
          style={[
            styles.exportButton,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
          onPress={handleExport}
        >
          <Text
            style={[
              styles.exportButtonText,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Export
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateRangeContainer}>
        {DATE_RANGES.map(range => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.dateRangeButton,
              {
                backgroundColor:
                  selectedRange === range.value
                    ? isDark
                      ? '#FFFFFF'
                      : '#000000'
                    : isDark
                    ? '#1A1A1A'
                    : '#F5F5F5',
              },
            ]}
            onPress={() => setSelectedRange(range.value)}
          >
            <Text
              style={[
                styles.dateRangeButtonText,
                {
                  color:
                    selectedRange === range.value
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : isDark
                      ? '#FFFFFF'
                      : '#000000',
                },
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Task Statistics
        </Text>
        {renderTaskDistributionChart()}
        {renderTaskCompletionChart()}
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.totalTasks}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Total Tasks
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.completedTasks}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Completed Tasks
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.totalTasks > 0
              ? Math.round((summary.completedTasks / summary.totalTasks) * 100)
              : 0}%
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Completion Rate
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Nutrition Statistics
        </Text>
        {renderCaloriesChart()}
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.totalMeals}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Total Meals
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.totalCalories}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Total Calories
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            {summary.totalMeals > 0
              ? Math.round(summary.totalCalories / summary.totalMeals)
              : 0}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            Average Calories per Meal
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Screen Views
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          {Object.entries(summary.screenViews).map(([screen, count]) => (
            <View key={screen} style={styles.screenViewRow}>
              <Text
                style={[
                  styles.screenName,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {screen}
              </Text>
              <Text
                style={[
                  styles.screenCount,
                  { color: isDark ? '#CCCCCC' : '#666666' },
                ]}
              >
                {count} views
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Daily Statistics
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          {summary.dailyStats.map(stat => (
            <View key={stat.date} style={styles.dailyStatRow}>
              <Text
                style={[
                  styles.dailyStatDate,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {format(new Date(stat.date), 'MMM d')}
              </Text>
              <View style={styles.dailyStatDetails}>
                <Text
                  style={[
                    styles.dailyStatValue,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  {stat.tasks} tasks ({stat.completedTasks} completed)
                </Text>
                <Text
                  style={[
                    styles.dailyStatValue,
                    { color: isDark ? '#FFFFFF' : '#000000' },
                  ]}
                >
                  {stat.meals} meals ({stat.calories} calories)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Recent Activity
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          {summary.recentEvents.map((event, index) => (
            <View key={index} style={styles.eventRow}>
              <Text
                style={[
                  styles.eventType,
                  { color: isDark ? '#FFFFFF' : '#000000' },
                ]}
              >
                {event.event_type}
              </Text>
              <Text
                style={[
                  styles.eventTime,
                  { color: isDark ? '#CCCCCC' : '#666666' },
                ]}
              >
                {format(new Date(event.timestamp), 'MMM d, h:mm a')}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {renderDateDetails()}
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
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  exportButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateRangeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  dateRangeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  card: {
    padding: 20,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    marginBottom: 15,
  },
  screenViewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenName: {
    fontSize: 16,
  },
  screenCount: {
    fontSize: 14,
  },
  dailyStatRow: {
    marginBottom: 15,
  },
  dailyStatDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  dailyStatDetails: {
    marginLeft: 10,
  },
  dailyStatValue: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventRow: {
    marginBottom: 10,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 14,
    marginTop: 2,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalStatItem: {
    width: '48%',
    marginBottom: 15,
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalStatLabel: {
    fontSize: 14,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartWrapper: {
    overflow: 'hidden',
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  controlButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  tooltip: {
    position: 'absolute',
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 150,
  },
});

export default AnalyticsScreen; 