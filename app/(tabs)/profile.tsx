import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Switch,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

type MenuRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
};

function MenuRow({ icon, label, sublabel, onPress, right, destructive }: MenuRowProps) {
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !right}
    >
      <View style={[styles.menuIconContainer, destructive && styles.menuIconDestructive]}>
        <Ionicons name={icon} size={18} color={destructive ? '#E57373' : Theme.colors.accent} />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={[styles.menuText, destructive && styles.menuTextDestructive]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSubLabel}>{sublabel}</Text> : null}
      </View>
      {right !== undefined ? right : (onPress && !destructive ? (
        <Ionicons name="chevron-forward" size={16} color={Theme.colors.textSecondary} />
      ) : null)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [partnerData, setPartnerData] = useState<any>(null);
  const [myStreak, setMyStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
    loadPreferences();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      setProfileLoading(true);
      const [meResp, dashResp] = await Promise.all([
        fetch(`${API_URL}/auth/me?user_id=${user.id}`),
        fetch(`${API_URL}/dashboard?user_id=${user.id}`)
      ]);
      const meData = await meResp.json();
      const dashData = await dashResp.json();
      setMyStreak(dashData?.me?.streak ?? 0);
      if (meData.partner_id) {
        setPartnerData({ id: meData.partner_id });
      } else {
        setPartnerData(null);
      }
    } catch {
      // Silently fail
    } finally {
      setProfileLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const notif = await AsyncStorage.getItem('pref_notifications');
      const reminder = await AsyncStorage.getItem('pref_daily_reminder');
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      if (reminder !== null) setDailyReminderEnabled(reminder === 'true');
    } catch {}
  };

  const savePreference = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch {}
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() }
      ]
    );
  };

  const handleUnlinkPartner = () => {
    Alert.alert(
      "Unlink Partner?",
      "This will disconnect both accounts immediately. Your mood history is preserved but you'll stop sharing data going forward.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Unlink", 
          style: "destructive", 
          onPress: async () => {
            setUnlinkLoading(true);
            try {
              const resp = await fetch(
                `${API_URL}/auth/unlink?user_id=${user?.id}`,
                { method: 'DELETE' }
              );
              const data = await resp.json();
              if (!resp.ok) throw new Error(data.detail || "Unlink failed.");
              
              setPartnerData(null);
              setShowPartnerPanel(false);
              Alert.alert(
                "Unlinked ✓",
                "You've been disconnected. Sign back in to re-link with a new invite code.",
                [{ text: "OK", onPress: () => supabase.auth.signOut() }]
              );
            } catch (e: any) {
              Alert.alert("Error", e.message || "Couldn't unlink. Please try again.");
            } finally {
              setUnlinkLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This permanently deletes your account and all mood data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => Alert.alert(
            "Contact Support", 
            "Email support@moodrings.app to complete account deletion (required for GDPR compliance)."
          )
        }
      ]
    );
  };

  const handlePrivacyInfo = () => {
    Alert.alert(
      "What Your Partner Sees",
      "✓ Your mood score (1–10)\n✓ Your emotion tags\n\n✗ Your journal entries (encrypted, private)\n✗ Your raw calendar events\n✗ Any text you write",
      [{ text: "Got it" }]
    );
  };

  const displayEmail = user?.email?.includes('@placeholder.com') 
    ? 'Anonymous account' 
    : user?.email ?? 'Unknown';

  const initials = displayEmail === 'Anonymous account' 
    ? '?' 
    : displayEmail[0].toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Profile</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileEmail} numberOfLines={1}>{displayEmail}</Text>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={14} color={Theme.colors.accent} />
              <Text style={styles.streakText}>{myStreak} day streak</Text>
            </View>
          </View>
          {profileLoading ? (
            <ActivityIndicator size="small" color={Theme.colors.accent} />
          ) : (
            <View style={[
              styles.partnerBadge,
              { backgroundColor: partnerData ? '#F0F7F2' : '#FFF5F0' }
            ]}>
              <Ionicons 
                name={partnerData ? "heart" : "heart-outline"} 
                size={12} 
                color={partnerData ? '#5A9A6A' : Theme.colors.textSecondary} 
              />
              <Text style={[
                styles.partnerBadgeText,
                { color: partnerData ? '#5A9A6A' : Theme.colors.textSecondary }
              ]}>
                {partnerData ? 'Linked' : 'Solo'}
              </Text>
            </View>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <MenuRow
            icon="notifications-outline"
            label="Push Notifications"
            sublabel="Suggestions and relationship alerts"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => { setNotificationsEnabled(v); savePreference('pref_notifications', v); }}
                trackColor={{ false: Theme.colors.border, true: '#C8E6CF' }}
                thumbColor={notificationsEnabled ? '#5A9A6A' : '#f4f3f4'}
              />
            }
          />
          <MenuRow
            icon="time-outline"
            label="Daily Check-in Reminder"
            sublabel="Nudge to log your mood each day"
            right={
              <Switch
                value={dailyReminderEnabled}
                onValueChange={(v) => { setDailyReminderEnabled(v); savePreference('pref_daily_reminder', v); }}
                trackColor={{ false: Theme.colors.border, true: '#C8E6CF' }}
                thumbColor={dailyReminderEnabled ? '#5A9A6A' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Partner section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner</Text>

          {/* Expandable partner management panel */}
          <TouchableOpacity
            style={[styles.menuItem, showPartnerPanel && styles.menuItemActive]}
            onPress={() => setShowPartnerPanel(v => !v)}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="heart-outline" size={18} color={Theme.colors.accent} />
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuText}>Partner Status</Text>
              <Text style={styles.menuSubLabel}>
                {partnerData ? 'Connected — tap to manage' : 'Not linked to a partner'}
              </Text>
            </View>
            <Ionicons 
              name={showPartnerPanel ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={Theme.colors.textSecondary} 
            />
          </TouchableOpacity>

          {/* Expanded panel */}
          {showPartnerPanel && (
            <View style={styles.partnerPanel}>
              {partnerData ? (
                <>
                  <View style={styles.partnerPanelHeader}>
                    <View style={styles.partnerPanelDot} />
                    <Text style={styles.partnerPanelStatus}>Connected</Text>
                  </View>
                  <Text style={styles.partnerPanelNote}>
                    You and your partner are sharing mood data. Both of you see the same dashboard and risk score.
                  </Text>
                  <TouchableOpacity
                    style={styles.unlinkButton}
                    onPress={handleUnlinkPartner}
                    disabled={unlinkLoading}
                    activeOpacity={0.7}
                  >
                    {unlinkLoading ? (
                      <ActivityIndicator size="small" color="#E57373" />
                    ) : (
                      <>
                        <Ionicons name="unlink-outline" size={16} color="#E57373" />
                        <Text style={styles.unlinkButtonText}>Unlink Partner</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.partnerPanelNote}>
                    You're not linked to anyone. Go to the pairing screen to connect with your partner.
                  </Text>
                  <View style={styles.partnerPanelNote2Row}>
                    <Ionicons name="information-circle-outline" size={14} color={Theme.colors.textSecondary} />
                    <Text style={styles.partnerPanelNote2}>Sign out and back in to start pairing.</Text>
                  </View>
                </>
              )}
            </View>
          )}

          <MenuRow
            icon="shield-checkmark-outline"
            label="What Your Partner Sees"
            sublabel="Scores & tags only — never your journal"
            onPress={handlePrivacyInfo}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <MenuRow
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://moodrings.app/privacy')}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Support & Feedback"
            sublabel="Get help or send us a note"
            onPress={() => Linking.openURL('mailto:support@moodrings.app')}
          />
          <MenuRow
            icon="information-circle-outline"
            label="Version"
            sublabel="MoodRings v1.0.0"
          />
        </View>

        {/* Account / danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            destructive
          />
          <MenuRow
            icon="trash-outline"
            label="Delete Account"
            sublabel="Permanently removes all your data"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        <Text style={styles.version}>Built with purpose. Designed with consent.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 30,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Theme.colors.accent,
    padding: 2,
    marginRight: Theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAE8DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 22,
    color: Theme.colors.accent,
  },
  profileInfo: {
    flex: 1,
    marginRight: 8,
  },
  profileEmail: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.pill,
  },
  partnerBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.sm,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    marginBottom: 6,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.soft,
  },
  menuItemActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAE8DC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  menuIconDestructive: {
    backgroundColor: '#FFEBEE',
  },
  menuTextBlock: {
    flex: 1,
  },
  menuText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 15,
    color: Theme.colors.textPrimary,
  },
  menuTextDestructive: {
    color: '#E57373',
  },
  menuSubLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },

  // Partner panel
  partnerPanel: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderBottomLeftRadius: Theme.borderRadius.md,
    borderBottomRightRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: 6,
  },
  partnerPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  partnerPanelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5A9A6A',
  },
  partnerPanelStatus: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
    color: '#5A9A6A',
  },
  partnerPanelNote: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  partnerPanelNote2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  partnerPanelNote2: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
  },
  unlinkButtonText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#E57373',
  },
  version: {
    textAlign: 'center',
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Theme.spacing.sm,
    marginBottom: 8,
  },
});