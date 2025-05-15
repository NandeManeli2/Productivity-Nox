import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import tw from 'twrnc';

const DashboardScreen: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' }
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.greeting,
            { color: isDark ? '#FFFFFF' : '#000000' }
          ]}
        >
          Welcome, {user?.user_metadata?.name || 'User'}!
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Today's Progress
          </Text>
          <Text style={[styles.cardValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Tasks Done: 5
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Streak
          </Text>
          <Text style={[styles.cardValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            3 days
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Nutrition
          </Text>
          <Text style={[styles.cardValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Calories: 1200/2000
          </Text>
        </View>
      </View>
    </ScrollView>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryContainer: {
    padding: 20,
    gap: 15,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DashboardScreen; 