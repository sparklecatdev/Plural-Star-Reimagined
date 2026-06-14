import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Text} from '../components/AppText';
import {Avatar} from '../components/Avatar';
import {useTranslation} from 'react-i18next';
import {Fonts, UI} from '../theme';
import {
  FrontState,
  FrontTier,
  FrontTierKey,
  Member,
  fmtTime,
  fmtDur,
  isFrontEmpty,
} from '../utils';

interface Props {
  theme: any;
  front: FrontState | null;
  getMember: (id: string) => Member | undefined;
  onSetFront: () => void;
  onEditDetails: (tier: FrontTierKey) => void;
}

const TIER_I18N_KEY: Record<FrontTierKey, string> = {
  primary: 'tier.primaryFront',
  coFront: 'tier.coFront',
  coConscious: 'tier.coConscious',
};

const TierCard = ({
  tier,
  tierKey,
  T,
  getMember,
  front,
  onEditDetails,
}: {
  tier: FrontTier;
  tierKey: FrontTierKey;
  T: any;
  getMember: (id: string) => Member | undefined;
  front: FrontState;
  onEditDetails: (tier: FrontTierKey) => void;
}) => {
  const {t} = useTranslation();

  const fs = (s: number) => Math.round(s * (T.textScale || 1));

  const [note, setNote] = useState(tier.note || '');

  useEffect(() => {
    setNote(tier.note || '');
  }, [tier.note]);

  const fronters = tier.memberIds
    .map(getMember)
    .filter(Boolean) as Member[];

  const isPrimary = tierKey === 'primary';
  const label = t(TIER_I18N_KEY[tierKey]);
  const accentColor =
    isPrimary ? T.accent : tierKey === 'coFront' ? T.info : T.success;

  return (
    <View style={{marginBottom: UI.sectionGap}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: accentColor,
          }}
        />
        <Text
          accessibilityRole="header"
          style={{
            fontSize: fs(10),
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: accentColor,
            fontWeight: '700',
          }}>
          {label}
        </Text>
        <View style={{flex: 1, height: 1, backgroundColor: T.border}} />
      </View>

      <View
        style={[
          s.tierCard,
          {backgroundColor: T.surface, borderColor: `${accentColor}18`},
        ]}>
        <View style={{gap: 12, marginBottom: 10}}>
          {fronters.length > 0 ? (
            fronters.map(m => (
              <View key={m.id} style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                <Avatar member={m} size={isPrimary ? 48 : 40} T={T} />
                <View style={{flex: 1}}>
                  <Text style={{fontSize: isPrimary ? fs(16) : fs(14), fontWeight: '500', color: T.text}}>
                    {m.name}
                  </Text>
                  {m.pronouns ? (
                    <Text style={{fontSize: fs(12), color: T.dim}}>
                      {m.pronouns}
                    </Text>
                  ) : null}
                  {m.role ? (
                    <Text style={{fontSize: fs(10), fontWeight: '600', letterSpacing: 1, marginTop: 1, color: m.color}}>
                      {m.role.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={{fontSize: fs(12), color: T.muted}}>
              {t('front.noOneFronting')}
            </Text>
          )}
        </View>

        {isPrimary && (
          <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 10, marginBottom: 10}}>
            <Text style={{fontSize: fs(11), color: T.muted}}>
              {t('front.frontingFor')}{' '}
              <Text style={{color: T.accent}}>{fmtDur(front.startTime)}</Text>{' '}
              · {t('front.since')} {fmtTime(front.startTime)}
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={() => onEditDetails(tierKey)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${t('front.frontNote')}, ${t('common.edit')}`} style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 10}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{fontSize: fs(9), letterSpacing: 1, color: T.dim}}>
              {t('front.frontNote')}
            </Text>
            <View style={{paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: T.card}}>
              <Text style={{fontSize: fs(11), fontWeight: '500', color: T.accent}} numberOfLines={1} maxFontSizeMultiplier={1.2}>{t('common.edit')}</Text>
            </View>
          </View>
          <Text style={{fontSize: fs(12), color: note ? T.text : T.muted, marginTop: 4}}>
            {note || t('front.noNote')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FrontScreen = ({
  theme: T,
  front,
  getMember,
  onSetFront,
  onEditDetails,
}: Props) => {
  const {t} = useTranslation();
  const fs = (s: number) => Math.round(s * (T.textScale || 1));

  const empty = isFrontEmpty(front);

  return (
    <View style={{flex: 1}}>
      <ScrollView
        style={{flex: 1, backgroundColor: T.bg}}
        contentContainerStyle={{
          padding: UI.screenPadding,
          paddingBottom: 140,
        }}>
        <View style={[s.headerCard, {backgroundColor: T.surface, borderColor: T.border}]}>
          <View style={s.headerRow}>
            <View style={{flex: 1}}>
              <Text
                style={{fontSize: fs(10), fontWeight: '700', letterSpacing: 1.4, color: T.accent, textTransform: 'uppercase', marginBottom: 8}}>
                {t('front.currentlyFronting')}
              </Text>
              <Text
                accessibilityRole="header"
                style={[s.heading, {color: T.text}]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}>
                {empty ? t('front.noOneFronting') : t('front.currentlyFronting')}
              </Text>
              <Text style={{fontSize: fs(12), color: T.dim, marginTop: 6}}>
                {empty ? t('front.update') : t('front.frontNote')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onSetFront}
              accessibilityRole="button"
              accessibilityLabel={t('front.update')}
              style={[
                s.btn,
                {backgroundColor: T.accent, borderColor: `${T.accent}40`},
              ]}>
              <Text
                style={[s.btnText, {color: T.bg}]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.2}>
                {t('front.update')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {empty ? (
          <View style={[s.emptyCard, {backgroundColor: T.surface, borderColor: T.border}]}>
            <Text style={{fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: T.dim, marginBottom: 8}}>
              {t('front.currentlyFronting')}
            </Text>
            <Text style={{color: T.muted, fontSize: fs(13), textAlign: 'center'}}>
              {t('front.noOneFronting')}
            </Text>
          </View>
        ) : (
          <>
            <TierCard
              tier={front!.primary}
              tierKey="primary"
              T={T}
              getMember={getMember}
              front={front!}
              onEditDetails={onEditDetails}
            />

            <TierCard
              tier={front!.coFront}
              tierKey="coFront"
              T={T}
              getMember={getMember}
              front={front!}
              onEditDetails={onEditDetails}
            />

            <TierCard
              tier={front!.coConscious}
              tierKey="coConscious"
              T={T}
              getMember={getMember}
              front={front!}
              onEditDetails={onEditDetails}
            />
          </>
        )}

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCard: {
    borderRadius: UI.radiusLg,
    borderWidth: 0,
    padding: 22,
    marginBottom: UI.sectionGap,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 24,
    fontWeight: '600',
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: UI.pill,
    borderWidth: 0,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tierCard: {
    borderRadius: UI.radiusLg,
    borderWidth: 0,
    padding: 18,
  },
  emptyCard: {
    borderRadius: UI.radiusLg,
    borderWidth: 0,
    padding: 28,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
