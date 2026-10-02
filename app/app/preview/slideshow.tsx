import { Image, StyleSheet, Text, View } from 'react-native';

export default function PreviewSlideshowScreen() {
  return (
    <View style={styles.root} testID="host-slideshow">
      <Image
        source={{ uri: 'https://qr.socialsave.cc/seed-samples/wedding-6.jpg' }}
        style={styles.img}
        resizeMode="contain"
      />
      <Text style={styles.caption}>მარიამი</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  img: { width: '100%', height: '80%' },
  caption: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});
