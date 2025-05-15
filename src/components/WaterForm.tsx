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
import { createWaterLog } from '../services/supabase';

interface WaterFormProps {
  onWaterLogged?: () => void;
}

const WaterForm: React.FC<WaterFormProps> = ({ onWaterLogged }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to log water intake');
      return;
    }

    try {
      setLoading(true);
      await createWaterLog({
        user_id: user.id,
        amount: Number(amount),
      });
      setAmount('');
      onWaterLogged?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to log water intake');
      console.error('Error logging water:', err);
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
        placeholder="Amount (ml)..."
        placeholderTextColor={isDark ? '#666666' : '#999999'}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        editable={!loading}
      />
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDark ? '#3498DB' : '#2980B9',
            opacity: loading ? 0.7 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging...' : 'Log Water'}
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

export default WaterForm; 