import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MealForm from '../components/MealForm';
import MealList from '../components/MealList';

const NutritionScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMealAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      <MealForm onMealAdded={handleMealAdded} />
      <MealList key={refreshKey} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default NutritionScreen; 