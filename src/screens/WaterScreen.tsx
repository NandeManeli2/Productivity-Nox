import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import WaterForm from '../components/WaterForm';
import WaterList from '../components/WaterList';
import WaterSummary from '../components/WaterSummary';

const WaterScreen: React.FC = () => {
  const { isDark } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWaterLogged = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
      ]}
    >
      <WaterSummary key={refreshKey} />
      <WaterForm onWaterLogged={handleWaterLogged} />
      <WaterList key={refreshKey} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WaterScreen; 