import { AnalyticsEvent } from '../types';
import { logAnalyticsEvent as logSupabaseEvent } from './supabase';

export type EventType =
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'meal_logged'
  | 'water_logged'
  | 'theme_changed'
  | 'screen_viewed'
  | 'search_performed'
  | 'settings_updated';

interface EventProperties {
  [key: string]: string | number | boolean | null;
}

class Analytics {
  private static instance: Analytics;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  async trackEvent(
    eventType: EventType,
    properties: EventProperties = {}
  ): Promise<void> {
    if (!this.userId) {
      console.warn('Analytics: No user ID set');
      return;
    }

    try {
      // Log to Supabase
      await logSupabaseEvent(this.userId, eventType);

      // Log to console in development
      if (__DEV__) {
        console.log('Analytics Event:', {
          eventType,
          properties,
          timestamp: new Date().toISOString(),
        });
      }

      // Here you could add other analytics providers like Firebase, Mixpanel, etc.
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Convenience methods for common events
  async trackTaskCreated(taskId: string): Promise<void> {
    await this.trackEvent('task_created', { taskId });
  }

  async trackTaskCompleted(taskId: string): Promise<void> {
    await this.trackEvent('task_completed', { taskId });
  }

  async trackTaskDeleted(taskId: string): Promise<void> {
    await this.trackEvent('task_deleted', { taskId });
  }

  async trackMealLogged(mealId: string, calories: number): Promise<void> {
    await this.trackEvent('meal_logged', { mealId, calories });
  }

  async trackWaterLogged(amount: number): Promise<void> {
    await this.trackEvent('water_logged', { amount });
  }

  async trackThemeChanged(theme: string): Promise<void> {
    await this.trackEvent('theme_changed', { theme });
  }

  async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent('screen_viewed', { screenName });
  }

  async trackSearch(query: string): Promise<void> {
    await this.trackEvent('search_performed', { query });
  }

  async trackSettingsUpdate(setting: string, value: string | number | boolean): Promise<void> {
    await this.trackEvent('settings_updated', { setting, value });
  }
}

export const analytics = Analytics.getInstance(); 