import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Easing,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../constants/theme';

import { useTheme } from '../context/ThemeContext';

interface ParticleData {
  id: number;
  startX: number;
  startY: number;
  animX: Animated.Value;
  animY: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
}

interface MagnetParticleButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  particleCount?: number;
  gradientColors?: [string, string, ...string[]];
}

export function MagnetParticleButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  particleCount = 12,
  gradientColors,
}: MagnetParticleButtonProps) {
  const { colors, isDark } = useTheme();

  const activeGradient = gradientColors || [colors.accent, '#C9A882'];

  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const titleOpacity  = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const buttonGlow    = useRef(new Animated.Value(0.3)).current;
  const glowLoopRef   = useRef<Animated.CompositeAnimation | null>(null);

  // Stable particle array — generated once
  const particles = useRef<ParticleData[]>(
    Array.from({ length: particleCount }, (_, i) => {
      const angle  = (i / particleCount) * Math.PI * 2;
      const radius = 60 + (i % 3) * 15;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius;
      return {
        id: i,
        startX: sx,
        startY: sy,
        animX:   new Animated.Value(sx),
        animY:   new Animated.Value(sy),
        opacity: new Animated.Value(0.2 + (i % 4) * 0.08),
        size:    2 + (i % 3),
        color:   i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.accentDark : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.3)'),
      };
    })
  ).current;

  // --- idle: each particle drifts gently around its orbit ---
  const startIdleAnimation = useCallback(() => {
    particles.forEach((p, i) => {
      const floatNext = () => {
        const jitterX = (Math.random() - 0.5) * 18;
        const jitterY = (Math.random() - 0.5) * 18;
        const dur = 1400 + Math.random() * 1200;
        Animated.parallel([
          Animated.timing(p.animX, { toValue: p.startX + jitterX, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(p.animY, { toValue: p.startY + jitterY, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.opacity, { toValue: 0.55, duration: dur / 2, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0.15, duration: dur / 2, useNativeDriver: true }),
          ]),
        ]).start(({ finished }) => { if (finished) floatNext(); });
      };
      setTimeout(floatNext, i * 90);
    });
  }, [particles]);

  // --- magnetise: suck all particles to button centre ---
  const attractParticles = useCallback(() => {
    particles.forEach(p => {
      Animated.parallel([
        Animated.spring(p.animX, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.spring(p.animY, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [particles]);

  // --- release back to orbit ---
  const releaseParticles = useCallback(() => {
    particles.forEach(p => {
      Animated.parallel([
        Animated.spring(p.animX, { toValue: p.startX, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.spring(p.animY, { toValue: p.startY, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0.25, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [particles]);

  useEffect(() => {
    startIdleAnimation();

    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlow, { toValue: 0.55, duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(buttonGlow, { toValue: 0.3,  duration: 1250, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    glowLoopRef.current.start();

    return () => { glowLoopRef.current?.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading crossfade
  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity,   { toValue: loading ? 0 : 1, duration: 200, useNativeDriver: true }),
      Animated.timing(loadingOpacity, { toValue: loading ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [loading, titleOpacity, loadingOpacity]);

  const handlePressIn = () => {
    attractParticles();
    // Native driver for scale
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, useNativeDriver: true }).start();
    // JS driver for shadowOpacity separately
    Animated.timing(buttonGlow, { toValue: 0.8, duration: 150, useNativeDriver: false }).start();
  };

  const handlePressOut = () => {
    releaseParticles();
    // Native driver for scale
    Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    // JS driver back to slightly higher than idle
    Animated.timing(buttonGlow, { toValue: 0.4, duration: 200, useNativeDriver: false }).start();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Particle layer */}
      <View style={styles.particleContainer} pointerEvents="none">
        {particles.map(p => (
          <Animated.View
            key={p.id}
            style={[styles.particle, {
              width: p.size, height: p.size, borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [{ translateX: p.animX }, { translateY: p.animY }],
            }]}
          />
        ))}
      </View>

      {/* Outer View for shadowOpacity (JS driven) */}
      <Animated.View style={{
        shadowColor: colors.accentDark,
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        borderRadius: 29,
        elevation: 12,
        width: '100%',
      }}>
        {/* Inner View for scale transition (Native driven) */}
        <Animated.View style={{
          transform: [{ scale: scaleAnim }],
          width: '100%',
        }}>
          <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={1}
          >
            <LinearGradient
              colors={activeGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Animated.Text style={[styles.buttonText, { opacity: titleOpacity }]}>
                {title}
              </Animated.Text>
              <Animated.Text style={[styles.buttonText, styles.loadingText, { opacity: loadingOpacity }]}>
                Please wait...
              </Animated.Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'visible',
  },
  particleContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  button: {
    height: 56,
    borderRadius: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: Theme.fonts.headingBold,
    letterSpacing: 0.5,
  },
  loadingText: {
    position: 'absolute',
  },
});
