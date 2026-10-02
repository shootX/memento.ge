import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts } from '@/src/theme/typography';
import { colors } from '@/src/theme/colors';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
};

export function CodeInput({ value, onChange, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const setFromString = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
  };

  return (
    <Pressable style={styles.wrap} onPress={() => inputRef.current?.focus()}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setFromString}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        maxLength={length}
        style={styles.hidden}
        autoFocus
      />
      <View style={styles.row}>
        {digits.map((d, i) => (
          <View key={i} style={[styles.box, d.trim() && styles.boxFilled]}>
            <Text style={styles.digit}>{d.trim() ? d : ''}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  hidden: { position: 'absolute', opacity: 0, height: 0, width: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderColor: colors.lime },
  digit: {
    color: colors.fg,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    fontFamily: fonts.display,
  },
});
