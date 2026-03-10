import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthBackground } from '../../components/AuthBackground';
import { MagnetParticleButton } from '../../components/MagnetParticleButton';
import { Theme } from '../../constants/theme';
import { triggerOnboardingRefresh } from '../_layout';
import { DarkColors } from '../../constants/ThemeColors';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const isSmallScreen = H < 700;
const ONBOARDING_KEY = 'moodrings_onboarded';

// ─── Slide data ────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    visualType: 'rings',
    title: 'Your feelings,\ntogether',
    description: 'A shared space to log feelings, track trends, and grow closer every day.',
  },
  {
    id: 2,
    visualType: 'graph',
    title: 'See how you move\nthrough life',
    description: 'Visual insights help you understand each other better without having to say a word.',
  },
  {
    id: 3,
    visualType: 'cards',
    title: "We'll help you\nreconnect",
    description: 'Journal entries are yours alone. We promise complete privacy and security for your deepest thoughts.',
  },
];

// ─── Visual Hero Renderers ─────────────────────────────────────────────

function RingsVisual() {
  const ringsScale = useRef(new Animated.Value(0)).current;
  const ringsRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(ringsScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(ringsRotate, { toValue: 1, duration: 25000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringRotStr = ringsRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       {/* Background pulsing glow */}
       <Animated.View style={{
            position: 'absolute',
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: 'rgba(184,161,227,0.15)',
            transform: [{ scale: ringsScale }],
        }} />
      <Animated.View style={{ transform: [{ scale: ringsScale }, { rotate: ringRotStr }] }}>
        <Svg width={140} height={120} viewBox="0 0 80 68">
          <Circle cx={30} cy={34} r={24} stroke={DarkColors.accent} strokeWidth={2.5} fill="none" />
          <Circle cx={50} cy={34} r={24} stroke={DarkColors.accentLight} strokeWidth={2.5} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function GraphVisual() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       <View style={{ width: W * 0.7, height: H * 0.25, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="stats-chart" size={80} color={DarkColors.accent} style={{ opacity: 0.8 }} />
          <Text style={{ fontFamily: Theme.fonts.body, marginTop: 16, color: DarkColors.textSecondary, opacity: 0.5 }}>Insights Preview</Text>
       </View>
    </View>
  );
}

function CardsVisual() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
       <View style={{ width: W * 0.65, height: H * 0.3, backgroundColor: 'rgba(184,161,227,0.08)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(184,161,227,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="heart-half" size={80} color={DarkColors.accentLight} style={{ opacity: 0.9 }} />
          <Text style={{ fontFamily: Theme.fonts.body, marginTop: 16, color: DarkColors.textSecondary, opacity: 0.5 }}>Suggestions Engine</Text>
       </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
// ONBOARDING SCREEN (60/40 Split)
// ═════════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      triggerOnboardingRefresh.fn();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    triggerOnboardingRefresh.fn();
  };

  const slideX = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;

  // Animate on slide change
  const handleSlideChange = async (next: number) => {
    Animated.timing(slideX, { toValue: -20, duration: 200, useNativeDriver: true }).start(() => {
      setCurrentSlide(next);
      slideX.setValue(20);
      Animated.timing(slideX, { toValue: 0, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  const onNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      await handleSlideChange(currentSlide + 1);
    } else {
      await handleNext();
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (val === 'true') {
        router.replace('/(auth)/login');
      }
    };
    checkStatus();
    Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <AuthBackground>
      <Animated.View style={{ flex: 1, opacity: screenOpacity }}>
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* Top Absolute Skip Link */}
          <TouchableOpacity style={os.skipTopBtn} onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={os.skipTopText}>Skip</Text>
          </TouchableOpacity>

          {/* 60% Top Hero Canvas */}
          <View style={{ height: H * 0.60, width: '100%' }}>
            {/* Morphing Visual Nodes */}
            <Animated.View style={{ flex: 1, transform: [{ translateX: slideX }] }}>
               {slide.visualType === 'rings' && <RingsVisual />}
               {slide.visualType === 'graph' && <GraphVisual />}
               {slide.visualType === 'cards' && <CardsVisual />}
            </Animated.View>
          </View>

          {/* 40% Bottom Typography & Controls Canvas */}
          <View style={{ height: H * 0.40, width: '100%', paddingHorizontal: 32, justifyContent: 'space-between', paddingBottom: 40 }}>
            
            <Animated.View style={{ transform: [{ translateX: slideX }] }}>
              <Text style={os.titleText}>{slide.title}</Text>
              <Text style={os.descriptionText}>{slide.description}</Text>
            </Animated.View>

            <View style={{ width: '100%' }}>
              {/* Pagination Dots */}
              <View style={os.dotsRow}>
                {SLIDES.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      os.dot,
                      i === currentSlide ? os.dotActive : null,
                    ]}
                  />
                ))}
              </View>

              {/* Dynamic Action Button */}
              {currentSlide === SLIDES.length - 1 ? (
                <MagnetParticleButton
                  title="Get Started"
                  onPress={onNext}
                  gradientColors={['#B8A1E3', '#F7A6C4']}
                  style={{ width: '100%', marginTop: 8 }}
                />
              ) : (
                <View style={{ width: '100%', height: 56, justifyContent: 'center' }}>
                  <TouchableOpacity onPress={onNext} style={os.nextArrowBtn}>
                    <Ionicons name="arrow-forward" size={24} color={DarkColors.bgPrimary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

          </View>
        </SafeAreaView>
      </Animated.View>
    </AuthBackground>
  );
}

const os = StyleSheet.create({
  skipTopBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 28,
    zIndex: 100,
  },
  skipTopText: {
    fontFamily: Theme.fonts.bodyMedium,
    fontSize: 15,
    color: DarkColors.textMuted,
  },
  titleText: {
    fontFamily: Theme.fonts.headingBold,
    fontSize: isSmallScreen ? 34 : 40,
    color: DarkColors.textPrimary,
    lineHeight: isSmallScreen ? 40 : 46,
    letterSpacing: -1,
    marginBottom: 16,
  },
  descriptionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: DarkColors.textSecondary,
    lineHeight: 24,
    maxWidth: '90%',
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dotActive: {
    width: 24,
    backgroundColor: DarkColors.accent,
  },
  nextArrowBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6E9F0', // White contrast button
    alignItems: 'center',
    justifyContent: 'center',
  }
});