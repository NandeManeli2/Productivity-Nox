import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../services/analytics';

const SettingsScreen: React.FC = () => {
  const { isDark, theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  useEffect(() => {
    analytics.trackScreenView('Settings');
  }, []);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    await analytics.trackThemeChanged(newTheme);
  };

  const handleSignOut = async () => {
    await signOut();
  };

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
          Settings
        </Text>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Profile
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Name
          </Text>
          <Text
            style={[
              styles.value,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            {user?.user_metadata?.name || 'Not set'}
          </Text>
          <Text
            style={[
              styles.label,
              { color: isDark ? '#FFFFFF' : '#000000' },
            ]}
          >
            Email
          </Text>
          <Text
            style={[
              styles.value,
              { color: isDark ? '#CCCCCC' : '#666666' },
            ]}
          >
            {user?.email || 'Not set'}
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
          Appearance
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          <View style={styles.settingRow}>
            <Text
              style={[
                styles.settingLabel,
                { color: isDark ? '#FFFFFF' : '#000000' },
              ]}
            >
              Theme
            </Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      theme === 'light'
                        ? isDark
                          ? '#FFFFFF'
                          : '#000000'
                        : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        theme === 'light'
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : isDark
                          ? '#FFFFFF'
                          : '#000000',
                    },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      theme === 'dark'
                        ? isDark
                          ? '#FFFFFF'
                          : '#000000'
                        : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        theme === 'dark'
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : isDark
                          ? '#FFFFFF'
                          : '#000000',
                    },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor:
                      theme === 'system'
                        ? isDark
                          ? '#FFFFFF'
                          : '#000000'
                        : 'transparent',
                  },
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color:
                        theme === 'system'
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : isDark
                          ? '#FFFFFF'
                          : '#000000',
                    },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' },
          ]}
        >
          Account
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
          ]}
        >
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#FF4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen; 