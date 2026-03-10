export const Theme = {
  colors: {
    background: '#FFF7F3',
    surface: '#FDECEF',
    partnerA: '#E8A0A7', // Soft slate blue (Repurposed)
    partnerB: '#CDB4DB', // Dusty rose/blush (Repurposed)
    accent: '#E8A0A7',    // Warm terracotta
    textPrimary: '#4A3A4F',
    textSecondary: 'rgba(74,58,79,0.6)',
    success: '#A8DADC',   // Low stress
    warning: '#FFD166',   // Mid stress
    alert: '#F28482',     // High stress
    tagBackground: 'rgba(74,58,79,0.05)',
    border: 'rgba(74,58,79,0.1)',
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
