import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidStyle,
  TriggerType,
  TimeUnit,
  IntervalTrigger,
  TimestampTrigger,
  RepeatFrequency,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {FrontState, Member, Medication, MedicalAppointment, fmtDur, fmtTime} from '../utils';
import i18n from '../i18n/i18n';

export const NOTIF_CHANNEL_ID = 'plural-space-front';
export const NOTIF_ID = 'ps-front-status';

export const REMINDER_CHANNEL_ID = 'plural-space-reminders';
export const FRONT_CHECK_NOTIF_ID = 'ps-front-check';
export const NOTEBOARD_NOTIF_ID = 'ps-noteboard-unread';
const supportsLocalNotifications = Platform.OS === 'android';

export const setupNotificationChannel = async () => {
  if (!supportsLocalNotifications) return;
  await notifee.createChannel({
    id: NOTIF_CHANNEL_ID,
    name: 'Front Status',
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
    sound: '',
  });
};

export const setupReminderChannel = async () => {
  if (!supportsLocalNotifications) return;
  await notifee.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Reminders',
    importance: AndroidImportance.DEFAULT,
    visibility: AndroidVisibility.PUBLIC,
  });
};

let emergencyLine: string | null = null;
export const setEmergencyNotificationInfo = (line: string | null) => {
  emergencyLine = line;
};

const resolveNames = (ids: string[], members: Member[]): string =>
  ids.map(id => members.find(m => m.id === id)?.name || '?').join(', ');

const getTierIds = (front: any, tier: string): string[] => {
  if (front?.[tier]?.memberIds && Array.isArray(front[tier].memberIds)) {
    return front[tier].memberIds;
  }
  if (tier === 'primary' && Array.isArray(front?.memberIds)) {
    return front.memberIds;
  }
  return [];
};

const getTierField = (front: any, tier: string, field: string): string | undefined => {
  if (front?.[tier]?.[field] !== undefined) return front[tier][field];
  if (tier === 'primary' && front?.[field] !== undefined) return front[field];
  return undefined;
};

const buildFrontContent = (front: FrontState, members: Member[]): {title: string; body: string; bigText: string} | null => {
  const primaryIds = getTierIds(front, 'primary');
  const coFrontIds = getTierIds(front, 'coFront');
  const coConsciousIds = getTierIds(front, 'coConscious');

  if (primaryIds.length === 0 && coFrontIds.length === 0 && coConsciousIds.length === 0) return null;

  const primaryNames = resolveNames(primaryIds, members);
  const coFrontNames = resolveNames(coFrontIds, members);
  const coConsciousNames = resolveNames(coConsciousIds, members);

  const duration = fmtDur(front.startTime);
  const titleNames = primaryNames || coFrontNames || coConsciousNames ||
    i18n.t('common.unknown', {defaultValue: 'Unknown'});
  const title = `◈ ${titleNames}  ·  ${duration}`;

  const lines: string[] = [];
  if (primaryIds.length > 0)
    lines.push(i18n.t('notification.primary', {names: primaryNames, defaultValue: `Primary: ${primaryNames}`}));
  if (coFrontIds.length > 0)
    lines.push(i18n.t('notification.coFront', {names: coFrontNames, defaultValue: `Co-Front: ${coFrontNames}`}));
  if (coConsciousIds.length > 0)
    lines.push(i18n.t('notification.coConscious', {names: coConsciousNames, defaultValue: `Co-Conscious: ${coConsciousNames}`}));

  const primaryMood = getTierField(front, 'primary', 'mood');
  const primaryLocation = getTierField(front, 'primary', 'location');
  const primaryNote = getTierField(front, 'primary', 'note');

  if (primaryMood)
    lines.push(i18n.t('notification.mood', {mood: primaryMood, defaultValue: `Mood: ${primaryMood}`}));
  if (primaryLocation)
    lines.push(i18n.t('notification.at', {location: primaryLocation, defaultValue: `At: ${primaryLocation}`}));
  if (primaryNote)
    lines.push(i18n.t('notification.note', {note: primaryNote, defaultValue: `Note: ${primaryNote}`}));
  lines.push(i18n.t('notification.since', {time: fmtTime(front.startTime), defaultValue: `Since ${fmtTime(front.startTime)}`}));

  if (emergencyLine) lines.push(emergencyLine);

  const summaryParts: string[] = [];
  if (emergencyLine) summaryParts.push(emergencyLine);
  if (coFrontIds.length > 0)
    summaryParts.push(i18n.t('notification.cfShort', {names: coFrontNames, defaultValue: `CF: ${coFrontNames}`}));
  if (coConsciousIds.length > 0)
    summaryParts.push(i18n.t('notification.ccShort', {names: coConsciousNames, defaultValue: `CC: ${coConsciousNames}`}));
  if (primaryMood)
    summaryParts.push(i18n.t('notification.mood', {mood: primaryMood, defaultValue: `Mood: ${primaryMood}`}));
  summaryParts.push(duration);

  return {title, body: summaryParts.join('  ·  '), bigText: lines.join('\n')};
};

const frontAndroidConfig = (bigText: string) => ({
  channelId: NOTIF_CHANNEL_ID,
  ongoing: true,
  onlyAlertOnce: true,
  autoCancel: false,
  smallIcon: 'ic_stat_notification',
  importance: AndroidImportance.LOW,
  visibility: AndroidVisibility.PUBLIC,
  pressAction: {id: 'default'},
  color: '#DAA520',
  style: {
    type: AndroidStyle.BIGTEXT as const,
    text: bigText,
  },
});

export const showFrontNotification = async (
  front: FrontState | null,
  members: Member[],
  systemName = 'Plural Star',
) => {
  try {
    if (!supportsLocalNotifications) return;

    if (!front) {
      await clearFrontNotification();
      return;
    }

    const content = buildFrontContent(front, members);
    if (!content) {
      await clearFrontNotification();
      return;
    }

    await setupNotificationChannel();

    await notifee.displayNotification({
      id: NOTIF_ID,
      title: content.title,
      body: content.body,
      android: frontAndroidConfig(content.bigText),
    });
  } catch (e) {
    console.error('[PluralSpace] Notification error:', e);
  }
};

export const scheduleFrontNotificationRefresh = async (
  front: FrontState | null,
  members: Member[],
  intervalMinutes: number,
) => {
  try {
    await cancelFrontNotificationRefresh();
    if (Platform.OS !== 'android') return;
    if (!front || !intervalMinutes || intervalMinutes < 15) return;
    const content = buildFrontContent(front, members);
    if (!content) return;
    await setupNotificationChannel();
    const trigger: IntervalTrigger = {
      type: TriggerType.INTERVAL,
      interval: intervalMinutes,
      timeUnit: TimeUnit.MINUTES,
    };
    await notifee.createTriggerNotification(
      {
        id: NOTIF_ID,
        title: content.title,
        body: content.body,
        android: frontAndroidConfig(content.bigText),
      },
      trigger,
    );
  } catch (e) {
    console.error('[PluralSpace] Notification refresh schedule error:', e);
  }
};

export const cancelFrontNotificationRefresh = async () => {
  try {
    if (!supportsLocalNotifications) return;
    await notifee.cancelTriggerNotification(NOTIF_ID);
  } catch (e) {
    console.error('[PluralSpace] Notification refresh cancel error:', e);
  }
};

export const clearFrontNotification = async () => {
  try {
    if (!supportsLocalNotifications) return;
    try { await notifee.cancelTriggerNotification(NOTIF_ID); } catch {}
    await notifee.cancelNotification(NOTIF_ID);
    try { await notifee.stopForegroundService(); } catch {}
  } catch (e) {
    console.error('[PluralSpace] Clear notification error:', e);
  }
};

export const scheduleFrontCheckReminder = async (intervalHours: number, singlet = false) => {
  try {
    await cancelFrontCheckReminder();
    if (!supportsLocalNotifications) return;
    if (!intervalHours || intervalHours <= 0) return;
    const title = singlet
      ? `◈ ${i18n.t('notification.statusCheck', {defaultValue: 'Status Check'})}`
      : `◈ ${i18n.t('notification.frontCheck', {defaultValue: 'Front Check'})}`;
    const body = singlet
      ? i18n.t('notification.whatsYourStatus', {defaultValue: "What's your status right now?"})
      : i18n.t('notification.whosFronting', {defaultValue: "Who's fronting right now?"});
    const androidConfig = {
      channelId: REMINDER_CHANNEL_ID,
      smallIcon: 'ic_stat_notification',
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
      pressAction: {id: 'default'},
      color: '#DAA520',
    };
    await setupReminderChannel();
    const trigger: IntervalTrigger = {
      type: TriggerType.INTERVAL,
      interval: intervalHours,
      timeUnit: TimeUnit.HOURS,
    };
    await notifee.createTriggerNotification(
      {id: FRONT_CHECK_NOTIF_ID, title, body, android: androidConfig},
      trigger,
    );
  } catch (e) {
    console.error('[PluralSpace] Front-check schedule error:', e);
  }
};

export const cancelFrontCheckReminder = async () => {
  try {
    if (!supportsLocalNotifications) return;
    await notifee.cancelTriggerNotification(FRONT_CHECK_NOTIF_ID);
    const ids = await notifee.getTriggerNotificationIds();
    await Promise.all(ids.filter(id => id.startsWith(`${FRONT_CHECK_NOTIF_ID}-`)).map(id => notifee.cancelTriggerNotification(id)));
  } catch (e) {
    console.error('[PluralSpace] Front-check cancel error:', e);
  }
};

export const showNoteboardNotification = async (
  entries: {memberName: string; unreadCount: number}[],
) => {
  try {
    if (Platform.OS !== 'android') return;
    if (!entries || entries.length === 0) return;
    await setupReminderChannel();
    const totalNotes = entries.reduce((sum, e) => sum + e.unreadCount, 0);
    const title = i18n.t('notification.noteboardUnreadTitle', {
      count: totalNotes,
      defaultValue: totalNotes === 1 ? '◇ 1 unread note' : `◇ ${totalNotes} unread notes`,
    });
    const summary = entries.map(e => `${e.memberName} (${e.unreadCount})`).join(', ');
    const bigLines = entries.map(e => {
      const label = i18n.t('notification.noteboardUnreadLine', {
        name: e.memberName,
        count: e.unreadCount,
        defaultValue: e.unreadCount === 1
          ? `${e.memberName}: 1 new note`
          : `${e.memberName}: ${e.unreadCount} new notes`,
      });
      return label;
    }).join('\n');
    await notifee.displayNotification({
      id: NOTEBOARD_NOTIF_ID,
      title,
      body: summary,
      android: {
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        importance: AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PUBLIC,
        pressAction: {id: 'default'},
        color: '#DAA520',
        style: {type: AndroidStyle.BIGTEXT, text: bigLines},
      },
    });
  } catch (e) {
    console.error('[PluralSpace] Noteboard notification error:', e);
  }
};

export const clearNoteboardNotification = async () => {
  try {
    if (!supportsLocalNotifications) return;
    await notifee.cancelNotification(NOTEBOARD_NOTIF_ID);
  } catch (e) {
    console.error('[PluralSpace] Noteboard notification clear error:', e);
  }
};

const MED_ID_PREFIX = 'ps-med-';
const APPT_ID_PREFIX = 'ps-appt-';

const nextDailyOccurrence = (hhmm: string): number => {
  const [hh, mm] = hhmm.split(':').map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
};

const cancelTriggersWithPrefix = async (prefix: string) => {
  try {
    if (!supportsLocalNotifications) return;
    const ids = await notifee.getTriggerNotificationIds();
    await Promise.all(ids.filter(id => id.startsWith(prefix)).map(id => notifee.cancelTriggerNotification(id)));
  } catch (e) {
    console.error('[PluralSpace] Trigger cancel error:', e);
  }
};

export const rescheduleMedicationReminders = async (medications: Medication[]) => {
  try {
    if (!supportsLocalNotifications) return;
    await cancelTriggersWithPrefix(MED_ID_PREFIX);
    await setupReminderChannel();
    for (const med of medications) {
      if (!med.enabled) continue;
      for (let i = 0; i < med.times.length; i++) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: nextDailyOccurrence(med.times[i]),
          repeatFrequency: RepeatFrequency.DAILY,
        };
        await notifee.createTriggerNotification(
          {
            id: `${MED_ID_PREFIX}${med.id}-${i}`,
            title: `💊 ${i18n.t('medical.medReminderTitle', {defaultValue: 'Medication Reminder'})}`,
            body: [med.name, med.dosage].filter(Boolean).join(' · '),
            android: {
              channelId: REMINDER_CHANNEL_ID,
              smallIcon: 'ic_stat_notification',
              importance: AndroidImportance.DEFAULT,
              visibility: AndroidVisibility.PUBLIC,
              pressAction: {id: 'default'},
              color: '#DAA520',
            },
          },
          trigger,
        );
      }
    }
  } catch (e) {
    console.error('[PluralSpace] Medication reminder schedule error:', e);
  }
};

export const rescheduleAppointmentReminders = async (appointments: MedicalAppointment[]) => {
  try {
    if (!supportsLocalNotifications) return;
    await cancelTriggersWithPrefix(APPT_ID_PREFIX);
    await setupReminderChannel();
    for (const appt of appointments) {
      const fireAt = appt.time - (appt.reminderMinutesBefore || 0) * 60 * 1000;
      if (fireAt <= Date.now()) continue;
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt,
      };
      await notifee.createTriggerNotification(
        {
          id: `${APPT_ID_PREFIX}${appt.id}`,
          title: `📅 ${i18n.t('medical.apptReminderTitle', {defaultValue: 'Appointment Reminder'})}`,
          body: [appt.title, fmtTime(appt.time), appt.location].filter(Boolean).join(' · '),
          android: {
            channelId: REMINDER_CHANNEL_ID,
            smallIcon: 'ic_stat_notification',
            importance: AndroidImportance.DEFAULT,
            visibility: AndroidVisibility.PUBLIC,
            pressAction: {id: 'default'},
            color: '#DAA520',
          },
        },
        trigger,
      );
    }
  } catch (e) {
    console.error('[PluralSpace] Appointment reminder schedule error:', e);
  }
};

export const showChatPingNotification = async (
  channelName: string,
  speakerName: string,
  preview: string,
) => {
  try {
    if (Platform.OS !== 'android') return;
    await setupReminderChannel();
    const safePreview = (preview || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    const title = i18n.t('notification.chatPingTitle', {
      speaker: speakerName,
      channel: channelName,
      defaultValue: `◆ ${speakerName} pinged you in #${channelName}`,
    });
    const body = safePreview
      ? i18n.t('notification.chatPingBody', {preview: safePreview, defaultValue: safePreview})
      : i18n.t('notification.chatPingBodyEmpty', {defaultValue: 'Tap to view the message.'});
    await notifee.displayNotification({
      id: `ps-chat-ping-${Date.now()}`,
      title,
      body,
      android: {
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        importance: AndroidImportance.DEFAULT,
        visibility: AndroidVisibility.PUBLIC,
        pressAction: {id: 'default'},
        color: '#DAA520',
        style: safePreview ? {type: AndroidStyle.BIGTEXT, text: safePreview} : undefined,
      },
    });
  } catch (e) {
    console.error('[PluralSpace] Chat ping notification error:', e);
  }
};
