import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { DarkBackground } from '../../components/DarkBackground';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type MenuRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
  colors: any;
};

function MenuRow({ icon, label, sublabel, onPress, right, destructive, colors }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: 'transparent' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !right}
    >
      <View style={[
        styles.menuIconContainer, 
        { backgroundColor: 'rgba(255,255,255,0.03)' }, 
        destructive && { backgroundColor: 'transparent' }
      ]}>
        <Ionicons 
          name={icon} 
          size={18} 
          color={destructive ? colors.textMuted : colors.accent} 
        />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={[styles.menuText, { color: colors.textPrimary }, destructive && { color: colors.textSecondary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.menuSubLabel, { color: colors.textMuted }]}>{sublabel}</Text> : null}
      </View>
      {right !== undefined ? right : (onPress && !destructive ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout, updateUser } = useAuth();
  const { mode: currentMode, setMode, colors, isDark } = useTheme();

  const [partnerData, setPartnerData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [myStreak, setMyStreak] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [showPartnerPanel, setShowPartnerPanel] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkConfirmVisible, setUnlinkConfirmVisible] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [signOutConfirmVisible, setSignOutConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchCalendarStatus();
    loadPreferences();
  }, [user]);

  const fetchCalendarStatus = async () => {
    if (!user) return;
    try {
      const resp = await fetch(`${API_URL}/calendar/status?user_id=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      setCalendarConnected(data.connected);
    } catch { }
  };

  const fetchProfileData = async () => {
    if (!user) return;
    try {
      setProfileLoading(true);
      const [meResp, dashResp] = await Promise.all([
        fetch(`${API_URL}/auth/me?user_id=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/dashboard?user_id=${user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const meData = await meResp.json();
      const dashData = await dashResp.json();
      setMyStreak(dashData?.me?.streak ?? 0);
      setProfileData(meData);
      
      if (meData.partner_id) {
        setPartnerData({ 
          id: meData.partner_id,
          display_name: meData.partner_display_name
        });
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
    } catch { }
  };

  const savePreference = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch { }
  };

  // ── Unlink: no Alert callbacks, inline confirm UI instead ─────────────────
  const performUnlink = async () => {
    if (!user?.id) return;
    setUnlinkLoading(true);
    setUnlinkError(null);
    try {
      const resp = await fetch(
        `${API_URL}/auth/unlink?user_id=${user.id}`,
        { 
          method: 'DELETE', 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.detail || 'Unlink failed.');
      }

      // 1. Clear partner data locally
      setPartnerData(null);
      setShowPartnerPanel(false);
      setUnlinkConfirmVisible(false);
      
      // 2. Update global user state
      await updateUser({ partner_id: null });
      
      // 3. Navigate back to pairing screen
      router.replace('/(auth)/pairing');
      
    } catch (e: any) {
      const errorMsg = e.message || 'Something went wrong. Please try again.';
      setUnlinkError(errorMsg);
      Alert.alert('Unlink Failed', errorMsg);
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
  };

  const performDeleteAccount = async () => {
    if (!user?.id) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const resp = await fetch(
        `${API_URL}/auth/me?user_id=${user.id}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || 'Failed to delete account.');
      }
      setDeleteConfirmVisible(false);
      logout();
    } catch (e: any) {
      setDeleteError(e.message || 'Something went wrong while deleting.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrivacyInfo = () => {
    Alert.alert(
      'What Your Partner Sees',
      '✓ Your mood score (1–10)\n✓ Your emotion tags\n\n✗ Your journal entries (encrypted, private)\n✗ Your raw calendar events\n✗ Any text you write',
      [{ text: 'Got it' }]
    );
  };

  const handleConnectCalendar = async () => {
    if (!user) return;
    setCalendarLoading(true);
    try {
      const resp = await fetch(`${API_URL}/calendar/connect`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          access_token: 'mock_google_access_token_' + Date.now(),
          refresh_token: 'mock_refresh_token'
        })
      });
      
      if (resp.ok) {
        setCalendarConnected(true);
        Alert.alert('Success', 'Google Calendar connected! We will now analyze your schedule for stress patterns.');
      } else {
        throw new Error('Failed to connect.');
      }
    } catch (e: any) {
      Alert.alert('Connection Error', e.message);
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user) return;
    setCalendarLoading(true);
    try {
      const resp = await fetch(`${API_URL}/calendar/disconnect?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        setCalendarConnected(false);
        Alert.alert('Disconnected', 'Google Calendar has been unlinked.');
      }
    } catch {
      Alert.alert('Error', 'Failed to disconnect.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const displayName = profileData?.display_name || user?.email?.split('@')[0] || 'Unknown';
  const displayEmail = user?.email?.includes('@placeholder.com')
    ? 'Anonymous account'
    : user?.email ?? 'Unknown';

  const initials = displayName !== 'Unknown' 
    ? displayName[0].toUpperCase() 
    : (displayEmail === 'Anonymous account' ? '?' : displayEmail[0].toUpperCase());

  const renderRelationshipTags = () => {
    if (!profileData?.relationship_type && !profileData?.together_duration) return null;
    
    return (
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
        {profileData.relationship_type && (
          <View style={[styles.relationshipTag, { backgroundColor: colors.bgTag }]}>
            <Text style={[styles.relationshipTagText, { color: colors.textPrimary }]}>
              {profileData.relationship_type === 'Married' || profileData.relationship_type === 'Engaged' ? '💍 ' : ''}
              {profileData.relationship_type}
            </Text>
          </View>
        )}
        {profileData.together_duration && (
          <View style={[styles.relationshipTag, { backgroundColor: colors.bgTag }]}>
            <Text style={[styles.relationshipTagText, { color: colors.textPrimary }]}>{profileData.together_duration}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderThemeOption = (label: string, mode: ThemeMode, icon: any) => {
    const isSelected = currentMode === mode;
    return (
      <TouchableOpacity 
        style={[
          styles.themePill, 
          { backgroundColor: colors.bgTag },
          isSelected && { backgroundColor: colors.bgTagSelected, borderColor: colors.borderAccent }
        ]} 
        onPress={() => setMode(mode)}
      >
        <Ionicons name={icon} size={16} color={isSelected ? colors.accent : colors.textSecondary} />
        <Text style={[
          styles.themePillText, 
          { color: colors.textSecondary },
          isSelected && { color: colors.accent, fontFamily: Theme.fonts.bodyBold }
        ]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <DarkBackground>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.header, { color: colors.textPrimary }]}>Profile</Text>

          {/* Profile card */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, paddingHorizontal: 10 }}>
            {/* My Avatar */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={[styles.avatarRing, { borderColor: '#B8A1E3' }]}>
                <View style={[styles.avatarInner, { backgroundColor: 'rgba(184,161,227,0.15)' }]}>
                  <Text style={[styles.avatarText, { color: '#B8A1E3' }]}>{initials}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: Theme.fonts.headingBold, fontSize: 16, color: colors.textPrimary, marginTop: 8 }} numberOfLines={1}>{displayName}</Text>
              <Text style={{ fontFamily: Theme.fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{myStreak} days 🔥</Text>
            </View>

            {/* Gradient Connector */}
            <View style={{ flex: 1, height: 2, marginHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}>
               {partnerData && (
                <LinearGradient colors={['#B8A1E3', '#F7A6C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 1 }} />
               )}
            </View>

            {/* Partner Avatar */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={[styles.avatarRing, { borderColor: partnerData ? '#F7A6C4' : 'rgba(230,233,240,0.15)' }]}>
                <View style={[styles.avatarInner, { backgroundColor: partnerData ? 'rgba(247,166,196,0.15)' : 'rgba(230,233,240,0.05)' }]}>
                  {profileLoading ? (
                    <ActivityIndicator size="small" color="#F7A6C4" />
                  ) : (
                    <Text style={[styles.avatarText, { color: partnerData ? '#F7A6C4' : colors.textMuted }]}>
                      {partnerData ? (partnerData.display_name ? partnerData.display_name[0].toUpperCase() : '?') : '+'}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={{ fontFamily: Theme.fonts.headingBold, fontSize: 16, color: colors.textPrimary, marginTop: 8 }} numberOfLines={1}>
                {partnerData ? partnerData.display_name || 'Partner' : 'Solo'}
              </Text>
              <Text style={{ fontFamily: Theme.fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {partnerData ? 'Linked' : 'Not linked'}
              </Text>
            </View>
          </View>

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>Appearance</Text>
            <View style={[styles.themeSelector, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}>
              {renderThemeOption('Light', 'light', 'sunny-outline')}
              {renderThemeOption('Dark', 'dark', 'moon-outline')}
              {renderThemeOption('System', 'system', 'settings-outline')}
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>Notifications</Text>
            <MenuRow
              icon="notifications-outline"
              label="Push Notifications"
              sublabel="Suggestions and relationship alerts"
              colors={colors}
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={(v) => { setNotificationsEnabled(v); savePreference('pref_notifications', v); }}
                  trackColor={{ false: colors.borderDefault, true: '#B8A1E3' }}
                  thumbColor={notificationsEnabled ? colors.accentSage : colors.textMuted}
                />
              }
            />
            <MenuRow
              icon="time-outline"
              label="Daily Check-in Reminder"
              sublabel="Nudge to log your mood each day"
              colors={colors}
              right={
                <Switch
                  value={dailyReminderEnabled}
                  onValueChange={(v) => { setDailyReminderEnabled(v); savePreference('pref_daily_reminder', v); }}
                  trackColor={{ false: colors.borderDefault, true: '#B8A1E3' }}
                  thumbColor={dailyReminderEnabled ? colors.accentSage : colors.textMuted}
                />
              }
            />
          </View>

          {/* Partner section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>Partner</Text>

            <TouchableOpacity
              style={[
                styles.menuItem, 
                { backgroundColor: colors.bgCard, borderColor: colors.borderDefault },
                showPartnerPanel && styles.menuItemActive
              ]}
              onPress={() => {
                setShowPartnerPanel(v => !v);
                setUnlinkConfirmVisible(false);
                setUnlinkError(null);
              }}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.bgTag }]}>
                <Ionicons name="heart-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.menuTextBlock}>
                <Text style={[styles.menuText, { color: colors.textPrimary }]}>Partner Status</Text>
                <Text style={[styles.menuSubLabel, { color: colors.textSecondary }]}>
                  {partnerData ? 'Connected — tap to manage' : 'Not linked to a partner'}
                </Text>
              </View>
              <Ionicons
                name={showPartnerPanel ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showPartnerPanel && (
              <View style={[styles.partnerPanel, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}>
                {partnerData ? (
                  <>
                    <View style={styles.partnerPanelHeader}>
                      <View style={[styles.partnerPanelDot, { backgroundColor: colors.accentSage }]} />
                      <Text style={[styles.partnerPanelStatus, { color: colors.accentSage }]}>
                        Connected with {partnerData.display_name || 'your partner'}
                      </Text>
                    </View>
                    {renderRelationshipTags()}
                    <Text style={[styles.partnerPanelNote, { color: colors.textSecondary, marginTop: 14 }]}>
                      You and your partner are sharing mood data. Both of you see the same dashboard and risk score.
                    </Text>

                    {/* ── Inline confirm flow — no Alert callbacks needed ── */}
                    {!unlinkConfirmVisible ? (
                      <TouchableOpacity
                        style={[styles.unlinkButton, { backgroundColor: 'rgba(255,255,255,0.03)' }]}
                        onPress={() => {
                          setUnlinkConfirmVisible(true);
                          setUnlinkError(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="unlink-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.unlinkButtonText, { color: colors.textSecondary }]}>Unlink Partner</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.unlinkConfirmBox, { backgroundColor: 'transparent', borderColor: colors.borderSubtle }]}>
                        <Text style={[styles.unlinkConfirmTitle, { color: colors.textSecondary }]}>Are you sure?</Text>
                        <Text style={[styles.unlinkConfirmBody, { color: colors.textSecondary }]}>
                          This disconnects both accounts immediately. Your mood history is preserved.
                        </Text>

                        {unlinkError && (
                          <Text style={[styles.unlinkErrorText, { color: colors.textAccent }]}>{unlinkError}</Text>
                        )}

                        <View style={styles.unlinkConfirmButtons}>
                          <TouchableOpacity
                            style={[styles.unlinkCancelBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}
                            onPress={() => {
                              setUnlinkConfirmVisible(false);
                              setUnlinkError(null);
                            }}
                            disabled={unlinkLoading}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.unlinkCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.unlinkConfirmBtn, { backgroundColor: colors.textAccent }, unlinkLoading && { opacity: 0.6 }]}
                            onPress={performUnlink}
                            disabled={unlinkLoading}
                            activeOpacity={0.7}
                          >
                            {unlinkLoading ? (
                              <ActivityIndicator size="small" color={colors.bgPrimary} />
                            ) : (
                              <Text style={[styles.unlinkConfirmText, { color: colors.bgPrimary }]}>Yes, Unlink</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[styles.partnerPanelNote, { color: colors.textSecondary }]}>
                      You're not linked to anyone. Go to the pairing screen to connect with your partner.
                    </Text>
                    <View style={styles.partnerPanelNote2Row}>
                      <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.partnerPanelNote2, { color: colors.textMuted }]}>Sign out and back in to start pairing.</Text>
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
              colors={colors}
            />
          </View>

          {/* Integrations Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>Integrations</Text>
            <MenuRow
              icon="calendar-outline"
              label="Google Calendar"
              sublabel={calendarConnected ? "Connected" : "Analyze your schedule for stress"}
              colors={colors}
              onPress={calendarConnected ? handleDisconnectCalendar : handleConnectCalendar}
              right={
                calendarLoading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <View style={[
                    styles.connBadge, 
                    { backgroundColor: calendarConnected ? 'rgba(122,171,138,0.1)' : 'rgba(255,255,255,0.03)' }
                  ]}>
                    <Text style={[
                      styles.connBadgeText, 
                      { color: calendarConnected ? colors.accentSage : colors.textMuted }
                    ]}>
                      {calendarConnected ? 'LINKED' : 'CONNECT'}
                    </Text>
                  </View>
                )
              }
            />
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>About</Text>
            <MenuRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => router.push('/privacy')}
              colors={colors}
            />
            <MenuRow
              icon="help-circle-outline"
              label="Support & Feedback"
              sublabel="Get help or send us a note"
              onPress={() => router.push('/support')}
              colors={colors}
            />
            <MenuRow
              icon="information-circle-outline"
              label="Version"
              sublabel="MoodRings v1.0.0"
              colors={colors}
            />
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textAccentSoft }]}>Account</Text>
            
            {!signOutConfirmVisible ? (
              <MenuRow
                icon="log-out-outline"
                label="Sign Out"
                onPress={() => setSignOutConfirmVisible(true)}
                destructive
                colors={colors}
              />
            ) : (
              <View style={[styles.signOutBox, { backgroundColor: `${colors.accent}10`, borderColor: colors.borderAccentSoft }]}>
                <Text style={[styles.signOutTitle, { color: colors.textAccent }]}>Are you sure you want to sign out?</Text>
                <View style={styles.inlineButtonsRow}>
                  <TouchableOpacity
                    style={[styles.inlineCancelBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}
                    onPress={() => setSignOutConfirmVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inlineCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inlineConfirmBtn, { backgroundColor: colors.textAccent }]}
                    onPress={handleSignOut}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.inlineConfirmText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!deleteConfirmVisible ? (
              <MenuRow
                icon="trash-outline"
                label="Delete Account"
                sublabel="Permanently removes all your data"
                onPress={() => setDeleteConfirmVisible(true)}
                destructive
                colors={colors}
              />
            ) : (
              <View style={[styles.signOutBox, { backgroundColor: `${colors.accent}10`, borderColor: colors.borderAccentSoft }]}>
                <Text style={[styles.signOutTitle, { color: colors.textAccent }]}>Delete everything?</Text>
                <Text style={[styles.unlinkConfirmBody, { color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
                  This permanently erases your moods, tags, and unlinks your connection. This cannot be undone.
                </Text>
                {deleteError ? (
                  <Text style={[styles.unlinkErrorText, { color: colors.textAccent, textAlign: 'center' }]}>{deleteError}</Text>
                ) : null}
                <View style={styles.inlineButtonsRow}>
                  <TouchableOpacity
                    style={[styles.inlineCancelBtn, { backgroundColor: colors.bgCard, borderColor: colors.borderDefault }]}
                    onPress={() => setDeleteConfirmVisible(false)}
                    disabled={deleteLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.inlineCancelText, { color: colors.textSecondary }]}>Keep Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inlineConfirmBtn, { backgroundColor: colors.textAccent }, deleteLoading && { opacity: 0.6 }]}
                    onPress={performDeleteAccount}
                    disabled={deleteLoading}
                    activeOpacity={0.7}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color={colors.bgPrimary} />
                    ) : (
                      <Text style={[styles.inlineConfirmText, { color: colors.bgPrimary }]}>Delete Forever</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <Text style={[styles.version, { color: colors.textMuted }]}>Built with purpose. Designed with consent.</Text>
        </ScrollView>
      </SafeAreaView>
    </DarkBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 30,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    padding: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 22,
  },
  profileInfo: {
    flex: 1,
    marginRight: 8,
  },
  profileName: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    marginBottom: 6,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  partnerBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 11,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  menuItemActive: {
    borderBottomColor: 'transparent',
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextBlock: {
    flex: 1,
  },
  menuText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 15,
  },
  menuSubLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    marginTop: 1,
  },
  themeSelector: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themePillText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
  },
  partnerPanel: {
    borderTopWidth: 0,
    borderWidth: 1,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    marginBottom: 8,
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
  },
  partnerPanelStatus: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 13,
  },
  relationshipTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  relationshipTagText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 11,
  },
  partnerPanelNote: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
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
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  unlinkButtonText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
  },
  unlinkConfirmBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  unlinkConfirmTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 14,
    marginBottom: 6,
  },
  connBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  connBadgeText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  unlinkConfirmBody: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  unlinkErrorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    marginBottom: 10,
  },
  unlinkConfirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  unlinkCancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  unlinkCancelText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
  },
  unlinkConfirmBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  unlinkConfirmText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
  },
  signOutBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  signOutTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
  },
  inlineButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineCancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  inlineCancelText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
  },
  inlineConfirmBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
  },
  inlineConfirmText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
  },
});