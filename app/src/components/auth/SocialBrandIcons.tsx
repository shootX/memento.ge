import Svg, { Path } from 'react-native-svg';

type IconProps = { size?: number };

/** Google multicolor "G" mark (sign-in button companion). */
export function GoogleGIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.083 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.016 0 9.553-1.917 12.99-5.057l-5.995-4.877C29.083 36 24.514 32.657 22.303 28H12v8.083C15.438 41.837 19.438 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 5.995 4.877C38.801 41.902 44 37 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

/** Facebook "f" on brand blue buttons (white glyph). */
export function FacebookFIcon({ size = 20 }: IconProps) {
  const h = size;
  const w = (size * 10) / 20;
  return (
    <Svg width={w} height={h} viewBox="0 0 10 20" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        fill="#fff"
        d="M6.5 20v-7.2H9.1L9.6 9.6H6.5V7.4c0-1.1.3-1.9 1.9-1.9h1.6V2.1C9.5 2 8.4 2 7.2 2 4.6 2 3 3.4 3 6.2v3.4H0.5v3.2H3V20h3.5z"
      />
    </Svg>
  );
}

/** Apple logo for Sign in with Apple (white on black). */
export function AppleLogoIcon({ size = 20, color = '#fff' }: IconProps & { color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        fill={color}
        d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.47-.12-1.06.46-2.29 1.15-3.04.77-.83 2.12-1.48 3.014-1.51zM20.88 17.17c-.59 1.35-.87 1.96-1.63 3.16-1.06 1.56-2.55 3.5-4.4 3.51-1.65.01-2.08-.98-4.33-.98-2.25 0-2.72.95-4.37.99-1.87.04-3.3-1.83-4.36-3.39C.76 17.1-.82 11.64 1.55 8.37c1.18-1.62 3.04-2.58 4.78-2.58 2.23 0 3.63 1.02 4.47 1.02.82 0 2.65-1.26 4.47-1.08.76.03 2.88.31 4.25 2.36-.11.07-2.54 1.48-2.51 4.4.03 3.52 3.08 4.68 3.12 4.7-.03.07-.49 1.68-1.65 3.48z"
      />
    </Svg>
  );
}
