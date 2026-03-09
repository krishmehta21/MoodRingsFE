import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WarmButton } from '../../components/WarmButton';
import { Theme } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PairingScreen() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'choice' | 'generate' | 'enter'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Block Android back button — navigate within modes, never crash
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (mode !== 'choice') {
          setMode('choice');
          return true;
        }
        return true; // Block back entirely on choice screen (no screen behind it)
      });
      return () => sub.remove();
    }, [mode])
  );

  const handleGenerateCode = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in before generating a code.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/auth/generate-code?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();

      if (resp.status === 200 && data.message === "You are already linked to a partner.") {
        Alert.alert(
          "Already Linked",
          "You're already connected to a partner. Head to the dashboard to see your stats.",
          [{ text: "Go to Dashboard", onPress: () => router.replace('/(tabs)') }]
        );
        return;
      }

      if (!resp.ok) throw new Error(data.detail || "Failed to generate code.");
      if (!data.invite_code) throw new Error("No invite code returned. Please try again.");

      setInviteCode(data.invite_code);
      setMode('generate');
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('fetch')) {
        Alert.alert(
          "Connection Error",
          "Can't reach the server. Make sure your backend is running and your device is on the same network.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Couldn't Generate Code", e.message || "Something went wrong. Please try again.", [{ text: "OK" }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPartner = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in before linking.");
      return;
    }
    if (!partnerCode || partnerCode.length < 6) {
      Alert.alert("Invalid Code", "Please enter the full 6-character invite code.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/auth/link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, invite_code: partnerCode })
      });
      const data = await resp.json();

      if (resp.status === 404) {
        Alert.alert("Code Not Found", "That invite code doesn't match anyone. Double-check with your partner and try again.");
        return;
      }
      if (resp.status === 400 && data.detail?.includes('yourself')) {
        Alert.alert("Nice try 😄", "You can't link to your own account. Ask your partner for their code.");
        return;
      }
      if (resp.status === 400 && data.detail?.includes('already linked')) {
        Alert.alert(
          "Already Linked",
          "One or both accounts are already connected to someone. If this is an error, contact support.",
          [{ text: "OK" }]
        );
        return;
      }
      if (!resp.ok) throw new Error(data.detail || "Linking failed. Please try again.");

      await updateUser({ partner_id: data.partner.id });
      setSuccess(true);
      setTimeout(() => router.replace('/(tabs)'), 3000);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('network') || e.message?.toLowerCase().includes('fetch')) {
        Alert.alert(
          "Connection Error",
          "Can't reach the server. Make sure your backend is running and your device is on the same network.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Linking Failed", e.message || "Something went wrong. Please try again.", [{ text: "OK" }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert("Copied!", "Your invite code has been copied to clipboard.");
    } catch {
      Alert.alert("Couldn't Copy", "Please copy the code manually: " + inviteCode);
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join me on MoodRings! Use my invite code: ${inviteCode}`,
      });
    } catch (e: any) {
      Alert.alert("Share Failed", e.message || "Couldn't open the share sheet.");
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.celebrationContainer}>
        <Ionicons name="sparkles" size={80} color={Theme.colors.accent} />
        <Text style={styles.celebrationTitle}>Connected!</Text>
        <Text style={styles.celebrationSubtitle}>
          You and your partner are now synced. Welcome to MoodRings together.
        </Text>
        <ActivityIndicator color={Theme.colors.accent} style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Back button — hides on choice screen since there's nowhere to go */}
        {mode !== 'choice' && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setMode('choice')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
        )}

        <View style={[styles.content, mode === 'choice' && { paddingTop: 60 }]}>

          {mode === 'choice' && (
            <>
              <Ionicons name="heart-circle-outline" size={64} color={Theme.colors.accent} style={{ marginBottom: 24 }} />
              <Text style={styles.title}>Better Together</Text>
              <Text style={styles.subtitle}>
                MoodRings is designed for two. Connect with your partner to share the journey.
              </Text>
              <WarmButton 
                title="Generate My Code" 
                onPress={handleGenerateCode} 
                loading={loading}
                style={styles.mainButton}
              />
              <Text style={styles.orText}>OR</Text>
              <WarmButton 
                title="Enter Partner's Code" 
                variant="outline" 
                onPress={() => setMode('enter')} 
                style={styles.mainButton}
              />
            </>
          )}

          {mode === 'generate' && (
            <>
              <Text style={styles.title}>Your Invite Code</Text>
              <Text style={styles.subtitle}>Share this with your partner. It expires in 48 hours.</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.largeCode}>{inviteCode}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={onShare}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={32} color={Theme.colors.accent} />
                  <Text style={styles.iconLabel}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={handleCopyCode}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="copy-outline" size={32} color={Theme.colors.accent} />
                  <Text style={styles.iconLabel}>Copy</Text>
                </TouchableOpacity>
              </View>
              <WarmButton 
                title="I've Shared It — Continue" 
                onPress={() => router.replace('/(tabs)')} 
                style={{ marginTop: 40 }}
              />
            </>
          )}

          {mode === 'enter' && (
            <>
              <Text style={styles.title}>Enter Partner's Code</Text>
              <Text style={styles.subtitle}>Paste the 6-character code your partner sent you.</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: AB1234"
                placeholderTextColor={Theme.colors.textSecondary}
                value={partnerCode}
                onChangeText={(t) => setPartnerCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                keyboardType="default"
              />
              {partnerCode.length > 0 && partnerCode.length < 6 && (
                <Text style={styles.hintText}>{6 - partnerCode.length} more characters needed</Text>
              )}
              <WarmButton 
                title={loading ? "Linking..." : "Link Account"} 
                onPress={handleLinkPartner} 
                loading={loading}
                disabled={partnerCode.length < 6 || loading}
                style={{ marginTop: 20, width: '100%' }}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  backButton: {
    padding: Theme.spacing.md,
    width: 60,
    height: 60,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 18,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  mainButton: {
    width: '100%',
  },
  orText: {
    fontFamily: Theme.fonts.bodyBold,
    marginVertical: 20,
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  codeContainer: {
    backgroundColor: Theme.colors.surface,
    padding: 30,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: '#EDE8E4',
    marginBottom: 30,
    ...Theme.shadows.soft,
  },
  largeCode: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 48,
    color: Theme.colors.accent,
    letterSpacing: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  input: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    padding: 20,
    borderRadius: Theme.borderRadius.md,
    fontFamily: Theme.fonts.headingBold,
    fontSize: 24,
    textAlign: 'center',
    color: Theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: '#EDE8E4',
  },
  hintText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 8,
  },
  celebrationContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  celebrationTitle: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 40,
    color: Theme.colors.accent,
    marginTop: 20,
  },
  celebrationSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 18,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 26,
  },
});