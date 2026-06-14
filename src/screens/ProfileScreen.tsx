import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Text} from '../components/AppText';
import {useTranslation} from 'react-i18next';
import {Fonts, UI} from '../theme';
import {AccentText} from '../components/AccentText';
import {RichText} from '../components/MarkdownRenderer';
import {Member, FrontState, getInitials, allFrontMemberIds} from '../utils';

type SubTab = 'profile' | 'statuses';

interface Props {
  theme: any;
  member?: Member;
  statuses: Member[];
  front: FrontState | null;
  onEditProfile: () => void;
  onAddStatus: () => void;
  onEditStatus: (m: Member) => void;
}

export const ProfileScreen = ({theme: T, member, statuses, front, onEditProfile, onAddStatus, onEditStatus}: Props) => {
  const {t} = useTranslation();
  const fs = (n: number) => Math.round(n * (T.textScale || 1));
  const [subTab, setSubTab] = useState<SubTab>('profile');
  const activeIds = allFrontMemberIds(front);

  return (
    <View style={{flex: 1, backgroundColor: T.bg}}>
      <View style={{paddingHorizontal: UI.screenPadding, paddingTop: UI.screenPadding}}>
        <View style={[s.headerCard, {backgroundColor: T.card, borderColor: T.border}]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text accessibilityRole="header" style={[s.heading, {color: T.text, flex: 1, fontSize: fs(22)}]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
            {t('tabs.profile')}
          </Text>
          {subTab === 'profile' ? (
            <TouchableOpacity onPress={onEditProfile} accessibilityRole="button" accessibilityLabel={t('profile.edit')}
              style={[s.btn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`}]}>
              <Text style={{fontSize: fs(13), fontWeight: '500', color: T.accent}} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('common.edit')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onAddStatus} accessibilityRole="button" accessibilityLabel={t('status.add')}
              style={[s.btn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`}]}>
              <Text style={{fontSize: fs(13), fontWeight: '500', color: T.accent}} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('profile.addStatus')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[s.segmentWrap, {backgroundColor: T.surface, borderColor: T.border}]}>
          {(['profile', 'statuses'] as SubTab[]).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setSubTab(tab)} activeOpacity={0.7}
              accessibilityRole="tab" accessibilityState={{selected: subTab === tab}}
              style={[s.subtab, subTab === tab && {backgroundColor: T.accentBg, borderColor: `${T.accent}45`}]}>
              <AccentText T={T} style={{fontSize: fs(13), fontWeight: subTab === tab ? '600' : '500', color: subTab === tab ? T.accent : T.dim}}>
                {tab === 'profile' ? t('tabs.profile') : t('profile.statuses')}
              </AccentText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </View>

      {subTab === 'profile' && (
        <ScrollView style={{flex: 1}} contentContainerStyle={{paddingHorizontal: UI.screenPadding, paddingTop: 8, paddingBottom: 140}}>
          <View style={[s.profileShell, {backgroundColor: T.card, borderColor: T.border}]}>
            {member?.banner ? (
              <Image source={{uri: member.banner}} style={s.banner} resizeMode="cover" />
            ) : (
              <View style={[s.bannerFallback, {backgroundColor: T.accentBg}]} />
            )}
            <View style={[s.profileCard, {backgroundColor: T.bg, borderColor: T.border}]}>
            <View style={{alignItems: 'center', marginBottom: 14}}>
              {member?.avatar ? (
                <Image source={{uri: member.avatar}} style={{width: 88, height: 88, borderRadius: 20, borderWidth: 2, borderColor: member.color || T.accent}} resizeMode="cover" />
              ) : (
                <View style={{width: 88, height: 88, borderRadius: 20, backgroundColor: member?.color || T.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)'}}>
                  <Text style={{fontSize: fs(30), fontWeight: '700', color: 'rgba(0,0,0,0.75)'}}>{getInitials(member?.name || '?')}</Text>
                </View>
              )}
              <Text style={{fontSize: fs(22), fontWeight: '600', color: T.text, marginTop: 10, textAlign: 'center'}} numberOfLines={2}>
                {member?.name || t('profile.notSetUp')}
              </Text>
              {member?.pronouns ? <Text style={{fontSize: fs(14), color: T.dim, marginTop: 3}}>{member.pronouns}</Text> : null}
              {member ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8}}>
                  <Text style={{fontSize: fs(10), letterSpacing: 1, textTransform: 'uppercase', color: T.dim, fontWeight: '600'}}>{t('profile.favoriteColor')}</Text>
                  <View style={{width: 16, height: 16, borderRadius: 8, backgroundColor: member.color || T.accent, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'}} />
                </View>
              ) : null}
            </View>

            <View style={[s.card, {backgroundColor: T.surface, borderColor: T.border, padding: 16}]}>
              {member?.description ? (
                <RichText text={member.description} T={T} />
              ) : (
                <Text style={{fontSize: fs(12), color: T.muted, fontStyle: 'italic'}}>{t('profile.noDescription')}</Text>
              )}
            </View>
            </View>
          </View>
        </ScrollView>
      )}

      {subTab === 'statuses' && (
        <ScrollView style={{flex: 1}} contentContainerStyle={{padding: UI.screenPadding, paddingBottom: 140}}>
          <Text style={{fontSize: fs(11), color: T.muted, marginBottom: 12, lineHeight: fs(16)}}>{t('profile.statusesDesc')}</Text>
          {statuses.length === 0 ? (
            <View style={[s.card, {backgroundColor: T.card, borderColor: T.border, padding: 18, alignItems: 'center'}]}>
              <Text style={{fontSize: fs(12), color: T.muted, fontStyle: 'italic'}}>{t('profile.noStatuses')}</Text>
            </View>
          ) : (
            <View style={[s.card, {backgroundColor: T.card, borderColor: T.border, overflow: 'hidden'}]}>
              {statuses.map((m, i) => {
                const active = activeIds.includes(m.id);
                return (
                  <TouchableOpacity key={m.id} onPress={() => onEditStatus(m)} activeOpacity={0.7}
                    accessibilityRole="button" accessibilityLabel={m.name}
                    style={{flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: i === statuses.length - 1 ? 0 : 1, borderBottomColor: T.border}}>
                    <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: m.color}} />
                    <Text style={{flex: 1, fontSize: fs(14), color: T.text, fontWeight: '500'}} numberOfLines={1}>{m.name}</Text>
                    {active && (
                      <View style={{paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: T.successBg, borderWidth: 1, borderColor: `${T.success}40`}}>
                        <Text style={{fontSize: fs(10), color: T.success, fontWeight: '600'}}>{t('profile.activeStatus')}</Text>
                      </View>
                    )}
                    <Text style={{fontSize: fs(12), color: T.muted}}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  headerCard: {borderRadius: UI.radiusLg, borderWidth: 1, padding: 14, marginBottom: 8},
  heading: {fontFamily: Fonts.display, letterSpacing: -0.5},
  segmentWrap: {flexDirection: 'row', borderWidth: 1, borderRadius: UI.radiusMd, padding: 4, marginTop: 12},
  subtab: {flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: 'transparent'},
  btn: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1},
  profileShell: {borderRadius: UI.radiusLg, borderWidth: 1, overflow: 'hidden'},
  banner: {width: '100%', aspectRatio: 2.4},
  bannerFallback: {width: '100%', aspectRatio: 2.4},
  profileCard: {margin: 12, marginTop: -48, borderRadius: UI.radiusLg, borderWidth: 1, padding: 16},
  card: {borderRadius: UI.radiusMd, borderWidth: 1},
});
