import React, {useState} from 'react';
import {View, Image, StyleSheet, ScrollView, KeyboardAvoidingView, TouchableOpacity} from 'react-native';
import {Text, TextInput} from '../components/AppText';
import {useTranslation} from 'react-i18next';
import {Fonts, UI} from '../theme';
import {useKeyboardBehavior} from '../hooks/useKeyboardBehavior';

interface Props {
  theme: any;
  onSave: (info: {name: string; description: string; singlet?: boolean}) => void;
}

export const SetupScreen = ({theme: T, onSave}: Props) => {
  const fs = (s: number) => Math.round(s * (T?.textScale || 1));
  const {t} = useTranslation();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [singlet, setSinglet] = useState(false);
  const behavior = useKeyboardBehavior();

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: T.bg}}
      behavior={behavior}>
      <ScrollView
        style={{flex: 1, backgroundColor: T.bg}}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled">
        <View style={[s.heroCard, {backgroundColor: T.surface}]}>
          <Image source={require('../assets/splash-logo.png')} style={s.logo} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
          <Text style={[s.kicker, {color: T.accent}]}>Plural Space</Text>
          <Text accessibilityRole="header" style={[s.heading, {color: T.text}]}>{t('setup.welcome')}</Text>
          <Text style={[s.sub, {color: T.dim}]}>{singlet ? t('setup.subtitleSinglet') : t('setup.subtitle')}</Text>
        </View>

        <View style={[s.formCard, {backgroundColor: T.card}]}>
          <View style={s.form}>
            <Text style={[s.label, {color: T.dim}]}>{singlet ? t('setup.yourName') : t('setup.systemName')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={singlet ? t('setup.yourNamePlaceholder') : t('setup.systemNamePlaceholder')}
              placeholderTextColor={T.muted} style={[s.input, {backgroundColor: T.surface, color: T.text}]} />
            <Text style={[s.label, {color: T.dim}]}>{singlet ? t('setup.goals') : t('setup.description')}</Text>
            <TextInput value={desc} onChangeText={setDesc} placeholder={singlet ? t('setup.goalsPlaceholder') : t('setup.descriptionPlaceholder')}
              placeholderTextColor={T.muted} multiline numberOfLines={4}
              style={[s.input, s.textarea, {backgroundColor: T.surface, color: T.text}]} />
            <TouchableOpacity onPress={() => name.trim() && onSave({name: name.trim(), description: desc.trim(), singlet})}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('setup.enter')} style={[s.btn, {backgroundColor: T.accent}]}>
              <Text style={[s.btnText, {color: T.bg}]}>{t('setup.enter')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSinglet(!singlet)} activeOpacity={0.7}
              accessibilityRole="button" accessibilityState={{selected: singlet}} accessibilityLabel={t('setup.observatory')}
              style={[s.modeBtn, {backgroundColor: singlet ? T.card : T.surface}]}>
              <Text style={{fontSize: fs(13), fontWeight: '700', color: singlet ? T.accent : T.dim}}>
                {singlet ? `✓ ${t('setup.observatory')}` : t('setup.observatory')}
              </Text>
              <Text style={{fontSize: fs(10), color: T.muted, marginTop: 4, textAlign: 'center'}}>{t('setup.observatoryHint')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: UI.screenPadding, paddingVertical: 32},
  heroCard: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: UI.radiusLg,
  },
  formCard: {
    borderRadius: UI.radiusLg,
    padding: 20,
  },
  logo: {width: 132, height: 132, marginBottom: 18},
  kicker: {fontSize: 11, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10},
  heading: {fontFamily: Fonts.display, fontSize: 34, fontWeight: '600', fontStyle: 'italic', marginBottom: 8},
  sub: {fontSize: 14, textAlign: 'center'},
  form: {width: '100%'},
  label: {fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 8, marginLeft: 4},
  input: {borderRadius: 24, paddingHorizontal: 18, paddingVertical: 15, fontSize: 14, marginBottom: 14},
  textarea: {minHeight: 108, textAlignVertical: 'top', paddingTop: 14},
  btn: {borderRadius: UI.pill, paddingVertical: 16, alignItems: 'center', marginTop: 8},
  btnText: {fontSize: 15, fontWeight: '700'},
  modeBtn: {borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center', marginTop: 14},
});
