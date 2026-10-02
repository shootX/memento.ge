import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View style={styles.container}>
        <Text style={styles.title}>გვერდი ვერ მოიძებნა</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>მთავარი</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.fg,
  },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 14, color: colors.lime },
});
