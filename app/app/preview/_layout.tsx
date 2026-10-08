import { Redirect, Stack } from 'expo-router';
import { config } from '@/src/config';

export default function PreviewLayout() {
  if (!config.includePreviewRoutes) {
    return <Redirect href="/" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
