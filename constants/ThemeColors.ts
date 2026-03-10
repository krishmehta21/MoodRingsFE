export type ThemeMode = 'dark' | 'light' | 'system';

export type ColorScheme = {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgCardHover: string;
  bgInput: string;
  bgInputFocus: string;
  bgTag: string;
  bgTagSelected: string;
  bgSuccess: string;
  bgWarning: string;
  bgDanger: string;

  // Borders
  borderDefault: string;
  borderSubtle: string;
  borderAccent: string;
  borderAccentSoft: string;
  borderInput: string;
  borderInputFocus: string;
  borderSuccess: string;
  borderWarning: string;
  borderDanger: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  textAccentSoft: string;
  textPlaceholder: string;
  textInverse: string;

  // Accent / Brand
  accent: string;
  accentLight: string;
  accentDark: string;
  accentGold: string;
  accentSage: string;

  // Chart
  chartUser: string;
  chartPartner: string;
  chartHappy: string;
  chartCalm: string;
  chartLoved: string;
  chartSad: string;
  chartAngry: string;
  chartGrateful: string;
  chartAnxious: string;
  chartGrid: string;
  chartAxis: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Status bar
  statusBar: 'dark-content' | 'light-content';
};

export const DarkColors: ColorScheme = {
  // Backgrounds
  bgPrimary: '#1A1B2F',
  bgSecondary: '#25274D',
  bgTertiary: '#2C2F48',
  bgCard: '#2C2F48',
  bgCardHover: '#3A3D5D',
  bgInput: '#141526',
  bgInputFocus: 'rgba(184,161,227,0.1)',
  bgTag: 'rgba(230,233,240,0.05)',
  bgTagSelected: 'rgba(184,161,227,0.15)',
  bgSuccess: 'rgba(139,211,221,0.15)',
  bgWarning: 'rgba(255,209,102,0.15)',
  bgDanger: 'rgba(242,132,130,0.20)',

  // Borders
  borderDefault: 'rgba(230,233,240,0.10)',
  borderSubtle: 'rgba(230,233,240,0.05)',
  borderAccent: 'rgba(184,161,227,0.35)',
  borderAccentSoft: 'rgba(184,161,227,0.15)',
  borderInput: 'rgba(230,233,240,0.10)',
  borderInputFocus: '#B8A1E3',
  borderSuccess: 'rgba(139,211,221,0.4)',
  borderWarning: 'rgba(255,209,102,0.4)',
  borderDanger: 'rgba(242,132,130,0.4)',

  // Text
  textPrimary: '#E6E9F0',
  textSecondary: 'rgba(230,233,240,0.60)',
  textMuted: 'rgba(230,233,240,0.35)',
  textAccent: '#B8A1E3',
  textAccentSoft: 'rgba(184,161,227,0.6)',
  textPlaceholder: 'rgba(230,233,240,0.20)',
  textInverse: '#1A1B2F',

  // Accent / Brand
  accent: '#B8A1E3',
  accentLight: '#D9C8F5',
  accentDark: '#9174CC',
  accentGold: '#F7A6C4',
  accentSage: '#8BD3DD',

  // Chart
  chartUser: '#B8A1E3',
  chartPartner: '#F7A6C4',
  chartHappy: '#FFD166',
  chartCalm: '#A8DADC',
  chartLoved: '#FFAFCC',
  chartSad: '#9FA8DA',
  chartAngry: '#F28482',
  chartGrateful: '#B5EAD7',
  chartAnxious: '#FFDAC1',
  chartGrid: 'rgba(230,233,240,0.07)',
  chartAxis: 'rgba(230,233,240,0.30)',

  // Tab bar
  tabBarBg: 'rgba(26,27,47,0.97)',
  tabBarBorder: 'rgba(184,161,227,0.08)',
  tabBarActive: '#B8A1E3',
  tabBarInactive: 'rgba(230,233,240,0.35)',

  // Status bar
  statusBar: 'light-content',
};

export const LightColors: ColorScheme = {
  // Backgrounds
  bgPrimary: '#FDF0F5',
  bgSecondary: '#F5E6F0',
  bgTertiary: '#FDECEF',
  bgCard: 'rgba(232,160,167,0.12)',
  bgCardHover: '#FCE1E6',
  bgInput: '#FFF7F3',
  bgInputFocus: 'rgba(232,160,167,0.1)',
  bgTag: 'rgba(74,58,79,0.05)',
  bgTagSelected: 'rgba(232,160,167,0.15)',
  bgSuccess: 'rgba(168,218,220,0.15)',
  bgWarning: 'rgba(255,209,102,0.15)',
  bgDanger: 'rgba(242,132,130,0.15)',
  
  // Borders
  borderDefault: 'rgba(196,120,158,0.15)',
  borderSubtle: 'rgba(74,58,79,0.05)',
  borderAccent: 'rgba(232,160,167,0.35)',
  borderAccentSoft: 'rgba(232,160,167,0.15)',
  borderInput: 'rgba(74,58,79,0.10)',
  borderInputFocus: '#E8A0A7',
  borderSuccess: 'rgba(168,218,220,0.4)',
  borderWarning: 'rgba(255,209,102,0.4)',
  borderDanger: 'rgba(242,132,130,0.4)',
  
  // Text
  textPrimary: '#2D1B33',
  textSecondary: 'rgba(74,58,79,0.60)',
  textMuted: 'rgba(74,58,79,0.35)',
  textAccent: '#C4789E',
  textAccentSoft: 'rgba(232,160,167,0.7)',
  textPlaceholder: 'rgba(74,58,79,0.25)',
  textInverse: '#FFF7F3',
  
  // Accent / Brand
  accent: '#C4789E',
  accentLight: '#FFB7A5',
  accentDark: '#D68991',
  accentGold: '#FFB7A5',
  accentSage: '#A8DADC',

  // Chart
  chartUser: '#E8A0A7',
  chartPartner: '#CDB4DB',
  chartHappy: '#FFD166',
  chartCalm: '#A8DADC',
  chartLoved: '#FFAFCC',
  chartSad: '#9FA8DA',
  chartAngry: '#F28482',
  chartGrateful: '#B5EAD7',
  chartAnxious: '#FFDAC1',
  chartGrid: 'rgba(74,58,79,0.06)',
  chartAxis: 'rgba(74,58,79,0.35)',

  // Tab bar
  tabBarBg: 'rgba(255,247,243,0.97)',
  tabBarBorder: 'rgba(232,160,167,0.15)',
  tabBarActive: '#E8A0A7',
  tabBarInactive: 'rgba(74,58,79,0.35)',

  // Status bar
  statusBar: 'dark-content',
};
