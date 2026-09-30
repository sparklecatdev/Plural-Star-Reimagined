import type {AppSettings, FrontState, Member} from '../utils';

const PK_SWITCH_URL = 'https://api.pluralkit.me/v2/systems/@me/switches';
const PK_MEMBER_REF_RE = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z]{5})$/i;
const USER_AGENT = 'PluralStar-Reimagined/1.22.0 (+https://github.com/sparklecatdev/Plural-Star-Reimagined)';
const SYNC_COOLDOWN_MS = 5000;

type SyncRequest = {
  token: string;
  memberRefs: string[];
  key: string;
};

let pendingRequest: SyncRequest | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight = false;
let lastSyncAt = 0;
let lastSyncedKey = '';

const pluralKitMemberRef = (value?: string): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const candidate = trimmed.startsWith('pk:') ? trimmed.slice(3) : trimmed;
  return PK_MEMBER_REF_RE.test(candidate) ? candidate : null;
};

const scheduleFlush = (delay: number) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushPluralKitFrontSync();
  }, delay);
};

const flushPluralKitFrontSync = async (): Promise<void> => {
  if (syncInFlight || !pendingRequest) return;
  const request = pendingRequest;
  pendingRequest = null;
  syncInFlight = true;
  lastSyncAt = Date.now();

  try {
    const response = await fetch(PK_SWITCH_URL, {
      method: 'POST',
      headers: {
        Authorization: request.token,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({members: request.memberRefs}),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[PS] PluralKit front sync failed:', response.status, body);
    } else {
      lastSyncedKey = request.key;
    }
  } catch (error) {
    console.error('[PS] PluralKit front sync error:', error);
  } finally {
    syncInFlight = false;
    if (pendingRequest) {
      scheduleFlush(Math.max(0, SYNC_COOLDOWN_MS - (Date.now() - lastSyncAt)));
    }
  }
};

export const queuePluralKitFrontSync = (
  front: FrontState | null,
  members: Member[],
  settings: AppSettings,
): void => {
  const token = settings.pkToken?.trim();
  if (!settings.pkFrontSyncEnabled || !token) return;

  const memberRefs = (front?.primary.memberIds || [])
    .map(id => pluralKitMemberRef(members.find(member => member.id === id)?.sourceId))
    .filter((value): value is string => !!value);
  const key = `${token}\0${memberRefs.join('|')}`;
  if (key === lastSyncedKey) return;

  pendingRequest = {token, memberRefs, key};
  const delay = syncInFlight
    ? SYNC_COOLDOWN_MS
    : Math.max(0, SYNC_COOLDOWN_MS - (Date.now() - lastSyncAt));
  if (delay === 0 && !syncInFlight) {
    void flushPluralKitFrontSync();
  } else {
    scheduleFlush(delay);
  }
};
