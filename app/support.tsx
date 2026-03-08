import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { WarmButton } from '../components/WarmButton';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.iconContainer}>
          <Ionicons name="help-buoy-outline" size={48} color={Theme.colors.accent} />
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>Find answers to common questions or contact our support team directly.</Text>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>Can I hide a journal entry?</Text>
          <Text style={styles.faqAnswer}>Yes, all journal entries are entirely private to you by default. Your partner only sees your mood score and tags on the shared dashboard.</Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How do I unlink my partner?</Text>
          <Text style={styles.faqAnswer}>You can unlink your partner at any time by going to the Profile Tab {'>'} Partner Status {'>'} Unlink Partner.</Text>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How is my risk score calculated?</Text>
          <Text style={styles.faqAnswer}>We securely process your combined mood arrays over time to determine relationship stress peaks autonomously using local analytical models.</Text>
        </View>

        <Text style={styles.sectionTitle}>Still need help?</Text>
        <WarmButton 
          title="Email Support Team"
          onPress={() => Linking.openURL('mailto:support@moodrings.app')}
          style={{ marginTop: 8 }}
        />
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
  iconContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  title: { fontFamily: Theme.fonts.headingBold, fontSize: 24, color: Theme.colors.textPrimary, marginTop: 16, marginBottom: 8 },
  subtitle: { fontFamily: Theme.fonts.body, fontSize: 15, color: Theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 },
  sectionTitle: { fontFamily: Theme.fonts.headingBold, fontSize: 18, color: Theme.colors.textPrimary, marginBottom: 16, marginTop: 8 },
  faqCard: { backgroundColor: Theme.colors.surface, padding: 16, borderRadius: Theme.borderRadius.md, marginBottom: 12, borderWidth: 1, borderColor: Theme.colors.border },
  faqQuestion: { fontFamily: Theme.fonts.bodyBold, fontSize: 15, color: Theme.colors.textPrimary, marginBottom: 6 },
  faqAnswer: { fontFamily: Theme.fonts.body, fontSize: 14, color: Theme.colors.textSecondary, lineHeight: 20 },
});
