import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors } from '../constants/ThemeColors';

const { height: H } = Dimensions.get('window');

const PARTICLE_DATA = [
  { top: '4%',  left: '8%',  size: 3, opacity: 0.40 },
  { top: '18%', left: '55%', size: 4, opacity: 0.25 },
  { top: '32%', left: '90%', size: 3, opacity: 0.35 },
  { top: '50%', left: '40%', size: 3, opacity: 0.27 },
  { top: '65%', left: '5%',  size: 4, opacity: 0.20 },
  { top: '80%', left: '30%', size: 3, opacity: 0.30 },
];

interface AuthBackgroundProps {
  children: React.ReactNode;
}

const drift = (
  animX: Animated.Value,
  animY: Animated.Value,
  xRange: number,
  yRange: number,
  duration: number
) => {
  Animated.loop(
    Animated.parallel([
      Animated.sequence([
        Animated.timing(animX, { toValue:  xRange, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(animX, { toValue: -xRange, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(animX, { toValue:  0,      duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(animY, { toValue:  yRange, duration: duration * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(animY, { toValue: -yRange, duration: duration * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(animY, { toValue:  0,      duration: duration * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ])
  ).start();
};

export function AuthBackground({ children }: AuthBackgroundProps) {
  const colors = DarkColors;
  const isDark = true;

  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3X = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

  // Particles
  const pAnims = useRef(PARTICLE_DATA.map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0.1),
  }))).current;

  useEffect(() => {
    drift(orb1X, orb1Y, 40, 30, 3000);
    drift(orb2X, orb2Y, 30, 40, 4000);
    drift(orb3X, orb3Y, 20, 25, 3500);

    pAnims.forEach((anim, i) => {
      const p = PARTICLE_DATA[i];
      drift(anim.x, anim.y, 8, 10, 4000 + i * 500);
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim.opacity, { toValue: p.opacity, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: p.opacity * 0.2, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <LinearGradient
        colors={[colors.bgPrimary, colors.bgSecondary, colors.bgTertiary]}
        style={StyleSheet.absoluteFill}
      />
      {/* Orb 1 — deep rose */}
      <Animated.View style={[styles.orb, {
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: colors.accentLight,
        top: -60, right: -80,
        opacity: isDark ? 0.20 : 0.15,
        transform: [{ translateX: orb1X }, { translateY: orb1Y }],
      }]} />
      {/* Orb 2 — dark plum */}
      <Animated.View style={[styles.orb, {
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: colors.accentDark,
        bottom: 100, left: -80,
        opacity: isDark ? 0.15 : 0.10,
        transform: [{ translateX: orb2X }, { translateY: orb2Y }],
      }]} />
      {/* Orb 3 — lighter rose */}
      <Animated.View style={[styles.orb, {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: colors.accent,
        top: '40%', left: -60,
        opacity: isDark ? 0.12 : 0.08,
        transform: [{ translateX: orb3X }, { translateY: orb3Y }],
      }]} />

      {/* Particles */}
      {PARTICLE_DATA.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[styles.particle, {
            top: p.top as any,
            left: p.left as any,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            opacity: pAnims[i].opacity,
            transform: [{ translateX: pAnims[i].x }, { translateY: pAnims[i].y }],
          }]}
        />
      ))}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'visible' },
  orb:  { position: 'absolute' },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(120,120,120,0.4)',
  },
});
