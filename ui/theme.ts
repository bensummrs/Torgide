export const Colors = {
  primary: '#FF0066',
  primaryLight: '#FF3385',
  primaryDark: '#CC0052',
  white: '#FFFFFF',
  black: '#0A0A0A',
  grey100: '#F5F5F5',
  grey200: '#E5E5E5',
  grey400: '#9E9E9E',
  grey600: '#616161',
  grey800: '#212121',
};

export const Fonts = {
  // Instrument Sans — used for big display/title text
  displayRegular: 'InstrumentSans_400Regular',
  displayMedium: 'InstrumentSans_500Medium',
  displaySemiBold: 'InstrumentSans_600SemiBold',
  // Inter — used for body, labels, UI text
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

export const Typography = {
  displayXL: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 48,
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  displayLG: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 36,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  displayMD: {
    fontFamily: Fonts.displayMedium,
    fontSize: 28,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  titleSM: {
    fontFamily: Fonts.displayMedium,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  bodyLG: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyMD: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
  bodySM: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
};
