export const Theme = {
  colors: {
    background: '#FAF8F5',
    surface: '#FFFFFF',
    partnerA: '#7B9EBE', // Soft slate blue
    partnerB: '#D4908A', // Dusty rose/blush
    accent: '#C4764A',    // Warm terracotta
    textPrimary: '#2C2420',
    textSecondary: '#9B8E89',
    success: '#7FAF8A',   // Low stress
    warning: '#E8B86D',   // Mid stress
    alert: '#C4764A',     // High stress
    tagBackground: '#F0EBE8',
    border: '#EDE8E4',
    shadow: 'rgba(44, 36, 32, 0.06)',
  },
  fonts: {
    heading: 'PlayfairDisplay_400Regular',
    headingBold: 'PlayfairDisplay_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodyBold: 'Inter_700Bold',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16, // Cards
    xl: 24, // Modals
    pill: 100,
  },
  shadows: {
    soft: {
      shadowColor: '#2C2420',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  },
};
