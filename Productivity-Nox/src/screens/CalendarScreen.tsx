import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'meal';
}

const CalendarScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(selectedDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );
      const hasEvents = events.some(
        event => new Date(event.date).toDateString() === date.toDateString()
      );

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            {
              backgroundColor: hasEvents ? '#CCCCCC' : 'transparent',
            },
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              {
                color: isDark ? '#FFFFFF' : '#000000',
                fontWeight:
                  date.toDateString() === selectedDate.toDateString()
                    ? 'bold'
                    : 'normal',
              },
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderEvents = () => {
    const selectedDateEvents = events.filter(
      event =>
        new Date(event.date).toDateString() === selectedDate.toDateString()
    );

    return (
      <FlatList
        data={selectedDateEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.eventItem,
              { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
            ]}
          >
            <Text
              style={[
                styles.eventTitle,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.eventType,
                { color: isDark ? '#CCCCCC' : '#666666' },
              ]}
            >
              {item.type}
            </Text>
          </View>
        )}
      />
    );
  };

  return (
    <View
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
          Calendar
        </Text>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text
              key={day}
              style={[
                styles.calendarHeaderText,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>{renderCalendar()}</View>
      </View>

      <View style={styles.eventsContainer}>
        <Text
          style={[
            styles.eventsTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Events for {selectedDate.toDateString()}
        </Text>
        {renderEvents()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  calendarContainer: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarHeaderText: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
  },
  eventsContainer: {
    flex: 1,
    padding: 20,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  eventItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventType: {
    fontSize: 14,
    marginTop: 5,
  },
});

export default CalendarScreen; 