import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

function GlowTabBar(props: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
    }}>
      {/* Frosted separator line */}
      <View style={{
        height: 1,
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.borderSubtle,
        marginHorizontal: 0,
      }} />
      <BottomTabBar {...props} />
    </View>
  );
}

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  activeName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  focused: boolean;
  color: string;
};

function TabIcon({ name, activeName, label, focused, color }: TabIconProps) {
  return (
    <View style={tabStyles.iconWrapper}>
      <View style={[
        tabStyles.iconContainer, 
        focused && { backgroundColor: 'transparent' }
      ]}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons 
            name={focused ? activeName : name} 
            size={24} 
            color={color} 
          />
          {focused && (
            <View style={{
              position: 'absolute',
              bottom: -6,
              width: 20,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#B8A1E3',
              shadowColor: '#B8A1E3',
              shadowOpacity: 0.9,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }} />
          )}
        </View>
      </View>
      <Text style={[
        tabStyles.label, 
        { color: color },
        focused && { fontFamily: Theme.fonts.bodyBold }
      ]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, mode } = useTheme();

  return (
    <Tabs
      key={mode} // Force re-render on theme change
      tabBar={(props) => <GlowTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(26,27,47,0.95)',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(26,27,47,0.95)' }]} />
        ),
        tabBarActiveTintColor: '#B8A1E3',
        tabBarInactiveTintColor: 'rgba(230,233,240,0.30)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home-outline" activeName="home" label="Home" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="log-mood"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -24,
              shadowColor: '#F7A6C4',
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}>
              <LinearGradient
                colors={['#B8A1E3', '#F7A6C4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: '100%', height: '100%', borderRadius: 30, justifyContent: 'center', alignItems: 'center' }}
              >
                <Ionicons name={focused ? 'add' : 'add-outline'} size={32} color="#1A1B2F" />
              </LinearGradient>
            </View>
          ),
        }}
        listeners={{ tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="analytics-outline" activeName="analytics" label="Insights" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person-outline" activeName="person" label="Profile" focused={focused} color={color} />
          ),
        }}
        listeners={{ tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: 64,
  },
  iconContainer: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  label: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});