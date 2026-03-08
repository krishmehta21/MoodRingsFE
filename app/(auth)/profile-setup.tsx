import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';
import { WarmButton } from '../../components/WarmButton';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

const RELATIONSHIP_TYPES = [
  'Dating',
  'Engaged',
  'Married',
  'Living together',
  'Long-distance'
];

const DURATIONS = [
  '< 6 months',
  '6–12 months',
  '1–3 years',
  '3–5 years',
  '5+ years'
];

export default function ProfileSetupScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [duration, setDuration] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setNameError(true);
      return;
    }
    
    setNameError(false);
    setLoading(true);
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const payload = {
        user_id: user?.id,
        display_name: displayName.trim(),
        age: age ? parseInt(age, 10) : null,
        relationship_type: relationshipType || null,
        together_duration: duration || null,
        anniversary_date: anniversary || null,
        timezone
      };

      const resp = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        throw new Error(data.detail || 'Failed to save profile');
      }
      
      // On success, forcefully hit standard explicit route navigation
      if (!user?.user_metadata?.partner_id) {
        router.replace('/(auth)/pairing');
      } else {
        router.replace('/(tabs)');
      }
      
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderPills = (
    options: string[], 
    selectedValue: string, 
    onSelect: (val: string) => void
  ) => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {options.map((opt) => {
          const isSelected = selectedValue === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.pill,
                isSelected && styles.pillSelected
              ]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[
                styles.pillText,
                isSelected && styles.pillTextSelected
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepIndicator}>Step 2 of 2</Text>
          <Text style={styles.title}>Tell Us About You</Text>
          <Text style={styles.subtitle}>Help us personalize your MoodRings experience.</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>What should we call you? *</Text>
            <TextInput
              style={[styles.input, nameError && styles.inputError]}
              placeholder="Your display name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (nameError) setNameError(false);
              }}
              autoCapitalize="words"
            />
            {nameError && <Text style={styles.errorText}>Display name is required</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Your age (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 28"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Relationship type (optional)</Text>
            {renderPills(RELATIONSHIP_TYPES, relationshipType, setRelationshipType)}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>How long together (optional)</Text>
            {renderPills(DURATIONS, duration, setDuration)}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Anniversary (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              value={anniversary}
              onChangeText={setAnniversary}
              keyboardType="number-pad"
            />
          </View>

          <WarmButton 
            title="Continue to Pairing" 
            onPress={handleSaveProfile} 
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    paddingBottom: 40,
  },
  stepIndicator: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.xs,
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  formGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    fontSize: 16,
    fontFamily: Theme.fonts.body,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  inputError: {
    borderColor: '#E57373',
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#E57373',
    marginTop: 6,
    marginLeft: 4,
  },
  pillContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pillSelected: {
    backgroundColor: Theme.colors.accent,
    borderColor: Theme.colors.accent,
  },
  pillText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  pillTextSelected: {
    color: '#FFF',
  },
  submitButton: {
    marginTop: Theme.spacing.lg,
  },
});
