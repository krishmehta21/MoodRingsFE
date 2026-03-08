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
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const { user } = useAuth();
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
        { method: 'DELETE' }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Unlink failed.');
      setPartnerData(null);
      setShowPartnerPanel(false);
      setUnlinkConfirmVisible(false);
      // Sign out after short delay so state updates are visible
      setTimeout(() => supabase.auth.signOut(), 800);
    } catch (e: any) {
      setUnlinkError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  const performDeleteAccount = async () => {
    if (!user?.id) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const resp = await fetch(
        `${API_URL}/auth/me?user_id=${user.id}`,
        { method: 'DELETE' }
      );
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || 'Failed to delete account.');
      }
      setDeleteConfirmVisible(false);
      supabase.auth.signOut();
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
          <View style={styles.relationshipTag}>
            <Text style={styles.relationshipTagText}>
              {profileData.relationship_type === 'Married' || profileData.relationship_type === 'Engaged' ? '💍 ' : ''}
              {profileData.relationship_type}
            </Text>
          </View>
        )}
        {profileData.together_duration && (
          <View style={styles.relationshipTag}>
            <Text style={styles.relationshipTagText}>{profileData.together_duration}</Text>
          </View>
        )}
      </View>
    );
  };

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
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
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
                name={partnerData ? 'heart' : 'heart-outline'}
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

          <TouchableOpacity
            style={[styles.menuItem, showPartnerPanel && styles.menuItemActive]}
            onPress={() => {
              setShowPartnerPanel(v => !v);
              setUnlinkConfirmVisible(false);
              setUnlinkError(null);
            }}
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
              name={showPartnerPanel ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {showPartnerPanel && (
            <View style={styles.partnerPanel}>
              {partnerData ? (
                <>
                  <View style={styles.partnerPanelHeader}>
                    <View style={styles.partnerPanelDot} />
                    <Text style={styles.partnerPanelStatus}>
                      Connected with {partnerData.display_name || 'your partner'}
                    </Text>
                  </View>
                  {renderRelationshipTags()}
                  <Text style={[styles.partnerPanelNote, { marginTop: 14 }]}>
                    You and your partner are sharing mood data. Both of you see the same dashboard and risk score.
                  </Text>

                  {/* ── Inline confirm flow — no Alert callbacks needed ── */}
                  {!unlinkConfirmVisible ? (
                    <TouchableOpacity
                      style={styles.unlinkButton}
                      onPress={() => {
                        setUnlinkConfirmVisible(true);
                        setUnlinkError(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="unlink-outline" size={16} color="#E57373" />
                      <Text style={styles.unlinkButtonText}>Unlink Partner</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.unlinkConfirmBox}>
                      <Text style={styles.unlinkConfirmTitle}>Are you sure?</Text>
                      <Text style={styles.unlinkConfirmBody}>
                        This disconnects both accounts immediately. Your mood history is preserved.
                      </Text>

                      {unlinkError && (
                        <Text style={styles.unlinkErrorText}>{unlinkError}</Text>
                      )}

                      <View style={styles.unlinkConfirmButtons}>
                        <TouchableOpacity
                          style={styles.unlinkCancelBtn}
                          onPress={() => {
                            setUnlinkConfirmVisible(false);
                            setUnlinkError(null);
                          }}
                          disabled={unlinkLoading}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.unlinkCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.unlinkConfirmBtn, unlinkLoading && { opacity: 0.6 }]}
                          onPress={performUnlink}
                          disabled={unlinkLoading}
                          activeOpacity={0.7}
                        >
                          {unlinkLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.unlinkConfirmText}>Yes, Unlink</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
            onPress={() => router.push('/privacy')}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Support & Feedback"
            sublabel="Get help or send us a note"
            onPress={() => router.push('/support')}
          />
          <MenuRow
            icon="information-circle-outline"
            label="Version"
            sublabel="MoodRings v1.0.0"
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {!signOutConfirmVisible ? (
            <MenuRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={() => setSignOutConfirmVisible(true)}
              destructive
            />
          ) : (
            <View style={styles.signOutBox}>
              <Text style={styles.signOutTitle}>Are you sure you want to sign out?</Text>
              <View style={styles.inlineButtonsRow}>
                <TouchableOpacity
                  style={styles.inlineCancelBtn}
                  onPress={() => setSignOutConfirmVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inlineConfirmBtn}
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
            />
          ) : (
            <View style={styles.signOutBox}>
              <Text style={styles.signOutTitle}>Delete everything?</Text>
              <Text style={[styles.unlinkConfirmBody, { textAlign: 'center', marginBottom: 12 }]}>
                This permanently erases your moods, tags, and unlinks your connection. This cannot be undone.
              </Text>
              {deleteError ? (
                <Text style={[styles.unlinkErrorText, { textAlign: 'center' }]}>{deleteError}</Text>
              ) : null}
              <View style={styles.inlineButtonsRow}>
                <TouchableOpacity
                  style={styles.inlineCancelBtn}
                  onPress={() => setDeleteConfirmVisible(false)}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineCancelText}>Keep Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineConfirmBtn, deleteLoading && { opacity: 0.6 }]}
                  onPress={performDeleteAccount}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.inlineConfirmText}>Delete Forever</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  profileName: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 20,
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
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
  relationshipTag: {
    backgroundColor: Theme.colors.tagBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  relationshipTagText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 11,
    color: Theme.colors.textPrimary,
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

  // Inline confirm box
  unlinkConfirmBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 14,
  },
  unlinkConfirmTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 14,
    color: '#C62828',
    marginBottom: 6,
  },
  unlinkConfirmBody: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  unlinkErrorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#E57373',
    marginBottom: 10,
  },
  unlinkConfirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  unlinkCancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  unlinkCancelText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  unlinkConfirmBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#E57373',
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
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Theme.spacing.sm,
    marginBottom: 8,
  },
  signOutBox: {
    backgroundColor: '#FFF5F5',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 14,
    marginBottom: 6,
  },
  signOutTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 16,
    color: '#C62828',
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
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  inlineCancelText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  inlineConfirmBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#E57373',
  },
  inlineConfirmText: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
  },
});