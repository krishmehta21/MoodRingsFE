import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { View, Text, StyleSheet, Platform } from 'react-native';

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
      <View style={[tabStyles.iconContainer, focused && tabStyles.iconContainerActive]}>
        <Ionicons 
          name={focused ? activeName : name} 
          size={20} 
          color={focused ? Theme.colors.accent : Theme.colors.textSecondary} 
        />
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {label}
      </Text>
    </View>
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
  iconContainerActive: {
    backgroundColor: '#FAE8DC',
  },
  label: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: Theme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  labelActive: {
    fontFamily: Theme.fonts.bodyBold,
    color: Theme.colors.accent,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 0,
          elevation: 8,
          shadowColor: Theme.colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="home-outline"
              activeName="home"
              label="Home"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log-mood"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="add-circle-outline"
              activeName="add-circle"
              label="Log"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="analytics-outline"
              activeName="analytics"
              label="Insights"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="person-outline"
              activeName="person"
              label="Profile"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}