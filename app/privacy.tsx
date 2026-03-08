import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: October 2026</Text>
        
        <Text style={styles.sectionTitle}>1. Data We Collect</Text>
        <Text style={styles.paragraph}>
          We collect your display name, relationship details, and daily mood logs. Your journal entries are encrypted and stored securely to ensure absolute privacy from any third parties.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          Your data is used exclusively to provide personalized relationship insights, metrics, and mood tracking algorithms locally. We do not sell your personal data to advertisers.
        </Text>

        <Text style={styles.sectionTitle}>3. What Your Partner Sees</Text>
        <Text style={styles.paragraph}>
          When paired, your partner can see your daily mood scores, tags, and relationship insights on their dashboard. Your private journal entries remain strictly confidential and are not shared.
        </Text>

        <Text style={styles.sectionTitle}>4. Data Deletion</Text>
        <Text style={styles.paragraph}>
          You have full ownership of your data. You can permanently delete your account and all associated mood matrices at any time from the Profile settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.lg, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: Theme.fonts.headingBold, fontSize: 18, color: Theme.colors.textPrimary },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  lastUpdated: { fontFamily: Theme.fonts.bodyBold, fontSize: 12, color: Theme.colors.textSecondary, marginBottom: 24, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: Theme.fonts.headingBold, fontSize: 18, color: Theme.colors.textPrimary, marginBottom: 8, marginTop: 16 },
  paragraph: { fontFamily: Theme.fonts.body, fontSize: 15, color: Theme.colors.textSecondary, lineHeight: 22 },
});
