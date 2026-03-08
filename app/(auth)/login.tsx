import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { Theme } from '../../constants/theme';
import { WarmButton } from '../../components/WarmButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      // Logic for partner check
      const hasPartner = !!data.user?.user_metadata?.partner_id;
      if (hasPartner) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/pairing');
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.appName}>MoodRings</Text>
          <Text style={styles.subtitle}>Welcome back to your shared space.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="hello@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <WarmButton 
              title="Log In" 
              onPress={handleLogin} 
              loading={loading}
              style={styles.loginButton}
            />

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text></Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
  },
  appName: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 48,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  label: {
    fontFamily: Theme.fonts.bodyBold,
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 24,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#EDE8E4',
    fontFamily: Theme.fonts.body,
  },
  loginButton: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  linkTextBold: {
    fontFamily: Theme.fonts.bodyBold,
    color: Theme.colors.accent,
  },
});
