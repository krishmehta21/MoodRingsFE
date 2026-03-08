import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';
import { WarmButton } from '../../components/WarmButton';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Your Relationship Heartbeat',
    description: 'A shared space to log feelings, track trends, and grow closer every day.',
    image: 'heart' // I'll use Ionicons for now since I can't generate images easily here
  },
  {
    id: 2,
    title: 'Stay in Sync',
    description: 'Visual insights help you understand each other better without having to say a word.',
    image: 'analytics'
  },
  {
    id: 3,
    title: 'Your Private Sanctuary',
    description: 'Journal entries are yours alone. We promise complete privacy and security for your deepest thoughts.',
    image: 'shield-checkmark'
  }
];

import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'moodrings_has_seen_onboarding';

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(auth)/login');
    }
  };


  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* Using icons as placeholders for "warm illustrations" */}
          <View style={styles.illustrationCircle}>
            <View style={{ transform: [{ scale: 3 }] }}>
                <Text style={{ fontSize: 40 }}>{slide.id === 1 ? '🏡' : slide.id === 2 ? '📊' : '🔐'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  currentSlide === i && styles.activeDot
                ]} 
              />
            ))}
          </View>

          <WarmButton 
            title={currentSlide === SLIDES.length - 1 ? "Start Your Journey" : "Continue"} 
            onPress={handleNext}
            style={styles.button}
          />

          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/login')}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F7F2EE', // Very soft warm wash
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE8E4',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  title: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: 32,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  description: {
    fontFamily: Theme.fonts.body,
    fontSize: 18,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Theme.spacing.md,
  },
  footer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EDE8E4',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: Theme.colors.accent,
  },
  button: {
    width: '100%',
    marginBottom: Theme.spacing.md,
  },
  skipButton: {
    padding: Theme.spacing.sm,
  },
  skipText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
});
