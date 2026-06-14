import React, {useState} from 'react';
import {View, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity} from 'react-native';
import {Text, TextInput} from '../components/AppText';
import {useTranslation} from 'react-i18next';
import {Fonts, UI} from '../theme';

interface Props {
  theme: any;
  password: string;
  systemName?: string;
  onUnlock: () => void;
}

export const LockScreen = ({theme: T, password, systemName, onUnlock}: Props) => {
  const fs = (s: number) => Math.round(s * (T?.textScale || 1));
  const {t} = useTranslation();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (input === password) {
      setInput('');
      setError('');
      onUnlock();
    } else {
      setError(t('lock.wrongPassword'));
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: T.bg}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={[s.heroCard, {backgroundColor: T.card, borderColor: `${T.accent}24`}]}>
          <Image source={require('../assets/splash-logo.png')} style={s.logo} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <Text style={[s.kicker, {color: T.accent}]}>Plural Space</Text>
          <Text accessibilityRole="header" style={[s.heading, {color: T.text}]}>{systemName || t('lock.locked')}</Text>
          <Text style={[s.sub, {color: T.dim}]}>{t('lock.subtitle')}</Text>
        </View>
        <View style={[s.formCard, {backgroundColor: T.card, borderColor: T.border}]}>
          <View style={s.form}>
            <Text style={[s.label, {color: T.dim}]}>{t('lock.password')}</Text>
            <TextInput
              value={input}
              onChangeText={v => { setInput(v); if (error) setError(''); }}
              placeholder={t('lock.passwordPlaceholder')}
              placeholderTextColor={T.muted}
              secureTextEntry
              autoFocus
              onSubmitEditing={submit}
              returnKeyType="go"
              style={[s.input, {backgroundColor: T.surface, color: T.text, borderColor: error ? T.danger : T.border}]}
            />
            {error ? <Text style={{fontSize: fs(12), color: T.danger, marginBottom: 10, marginTop: -8}}>{error}</Text> : null}
            <TouchableOpacity onPress={submit} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('lock.unlock')} style={[s.btn, {backgroundColor: T.accent}]}>
              <Text style={s.btnText}>{t('lock.unlock')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: UI.screenPadding, paddingVertical: 32},
  heroCard: {borderWidth: 1, borderRadius: UI.radiusLg, paddingHorizontal: 24, paddingVertical: 28, alignItems: 'center', marginBottom: UI.sectionGap},
  formCard: {borderWidth: 1, borderRadius: UI.radiusLg, padding: 18},
  logo: {width: 132, height: 132, marginBottom: 18},
  kicker: {fontSize: 11, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10},
  heading: {fontFamily: Fonts.display, fontSize: 30, fontWeight: '600', fontStyle: 'italic', marginBottom: 8, textAlign: 'center'},
  sub: {fontSize: 14, textAlign: 'center'},
  form: {width: '100%'},
  label: {fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 6},
  input: {borderWidth: 1, borderRadius: UI.radiusMd, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 14},
  btn: {borderRadius: UI.pill, paddingVertical: 15, alignItems: 'center', marginTop: 4},
  btnText: {fontSize: 15, fontWeight: '700', color: '#0a0508'},
});
