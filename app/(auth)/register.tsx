import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Theme } from '../../constants/theme';
import { WarmButton } from '../../components/WarmButton';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    setErrorMsg(null);
    try {
      await register(email, password);
      // Wait for layout to redirect based on token state, 
      // explicitly pushing to pairing per constraints
      router.replace('/(auth)/pairing');
    } catch (error: any) {
      let msg = error.message || 'Connection failed. Please check your internet and try again.';
      if (msg.includes('network') || msg.includes('timeout') || msg === 'Failed to fetch') {
         msg = 'Connection failed. Please check your internet and try again.';
      }
      setErrorMsg(msg);
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
          <Text style={styles.subtitle}>Begin your shared journey today.</Text>

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
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <WarmButton 
              title="Create Account" 
              onPress={handleRegister} 
              loading={loading}
              style={styles.registerButton}
            />

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log In</Text></Text>
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
  registerButton: {
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
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
});
