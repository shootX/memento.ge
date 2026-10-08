import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { OAuthPendingLinkForm } from '@/src/components/auth/SocialLoginSection';
import { Card } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';

/** Screenshot-only: Facebook pending-link step (mock API). */
export default function PreviewOAuthPending() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} testID="preview-oauth-pending">
      <Text style={styles.title}>შესვლა</Text>
      <Card style={styles.card}>
        <OAuthPendingLinkForm
          pending={{ pendingLinkId: 'preview-pl', email: null }}
          onResult={() => {}}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24 },
  title: { color: colors.fg, fontFamily: fonts.display, fontSize: 28, fontWeight: '800' },
  card: { marginTop: 20, gap: 12 },
});
