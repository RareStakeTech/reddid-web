/**
 * Canonical platform registry — single source of truth for all supported
 * social platforms in the ReddID ecosystem.
 *
 * Used by:
 * - /register page (form fields)
 * - /platforms page (support matrix)
 * - /explore page (filter chips)
 * - Social proof badges on tip pages and OG images
 * - Love Button popup (detectPlatform, PLAT_ICONS)
 */

export type PlatformStatus = 'live' | 'planned' | 'beta';

export interface PlatformDef {
  /** Machine-readable ID — matches socialProofs[].platform in db.ts */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Unicode symbol badge — no external images required */
  icon: string;
  /** Brand color hex (used for badges and highlights) */
  color: string;
  /** Extension support status */
  status: PlatformStatus;
  /** Returns the canonical profile URL for a given username */
  profileUrl: (username: string) => string;
  /** Short description shown on the /platforms page */
  description: string;
  /** Category for grouping */
  category: 'mainstream' | 'alternative' | 'decentralized' | 'creator' | 'developer';
  /**
   * For decentralized / federated platforms, the username may be a
   * fully-qualified handle like user@instance.social
   */
  federated?: boolean;
  /** Placeholder text for the social link input field */
  placeholder?: string;
}

export const PLATFORMS: PlatformDef[] = [
  // ── Mainstream ─────────────────────────────────────────────────────────────
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '𝕏',
    color: '#000000',
    status: 'live',
    category: 'mainstream',
    description: 'Twitter and X creator profiles. The largest social network — and the most likely to resist creator monetization tools they don\'t control.',
    profileUrl: u => `https://x.com/${u}`,
    placeholder: 'your_username',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶',
    color: '#FF0000',
    status: 'live',
    category: 'mainstream',
    description: 'YouTube channel pages via the /@handle URL format.',
    profileUrl: u => `https://youtube.com/@${u}`,
    placeholder: 'yourchannel',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '●',
    color: '#FF4500',
    status: 'live',
    category: 'mainstream',
    description: 'Reddit user profile pages (both old and new Shreddit UI).',
    profileUrl: u => `https://reddit.com/user/${u}`,
    placeholder: 'u/yourname',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '◈',
    color: '#E1306C',
    status: 'live',
    category: 'mainstream',
    description: 'Instagram creator and business profiles.',
    profileUrl: u => `https://instagram.com/${u}`,
    placeholder: 'yourhandle',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '♪',
    color: '#010101',
    status: 'live',
    category: 'mainstream',
    description: 'TikTok creator profiles at tiktok.com/@username.',
    profileUrl: u => `https://tiktok.com/@${u}`,
    placeholder: 'your.username',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: '⬟',
    color: '#9146FF',
    status: 'live',
    category: 'mainstream',
    description: 'Twitch streamer channel pages.',
    profileUrl: u => `https://twitch.tv/${u}`,
    placeholder: 'yourchannel',
  },

  // ── Alternative / aligned ──────────────────────────────────────────────────
  {
    id: 'rumble',
    name: 'Rumble',
    icon: '▣',
    color: '#85C742',
    status: 'live',
    category: 'alternative',
    description: 'Rumble video platform — strongly creator-friendly and crypto-receptive.',
    profileUrl: u => `https://rumble.com/c/${u}`,
    placeholder: 'yourchannel',
  },
  {
    id: 'truthsocial',
    name: 'TruthSocial',
    icon: '◉',
    color: '#5448EE',
    status: 'live',
    category: 'alternative',
    description: 'TruthSocial (Mastodon fork) — large audience with strong crypto overlap.',
    profileUrl: u => `https://truthsocial.com/@${u}`,
    placeholder: 'yourhandle',
  },
  {
    id: 'odysee',
    name: 'Odysee',
    icon: '◎',
    color: '#E50054',
    status: 'live',
    category: 'alternative',
    description: 'Odysee (LBRY network) — crypto-native video platform. Channels earn LBRY Credits natively; RDD adds a tipping layer.',
    profileUrl: u => `https://odysee.com/@${u}`,
    placeholder: 'YourChannel',
  },
  {
    id: 'kick',
    name: 'Kick',
    icon: '⚡',
    color: '#53FC18',
    status: 'live',
    category: 'alternative',
    description: 'Kick streaming platform — creator-first revenue splits; large Twitch-migrant creator base.',
    profileUrl: u => `https://kick.com/${u}`,
    placeholder: 'yourchannel',
  },

  // ── Decentralized ──────────────────────────────────────────────────────────
  {
    id: 'bluesky',
    name: 'Bluesky (AT Protocol)',
    icon: '☁',
    color: '#0085FF',
    status: 'live',
    category: 'decentralized',
    description: 'Bluesky — AT Protocol decentralized social. Philosophically aligned: open protocols, user-owned identity.',
    profileUrl: u => `https://bsky.app/profile/${u}`,
    placeholder: 'yourhandle.bsky.social',
  },
  {
    id: 'mastodon',
    name: 'Mastodon / ActivityPub',
    icon: '🐘',
    color: '#6364FF',
    status: 'live',
    category: 'decentralized',
    description: 'Mastodon and ActivityPub-compatible instances. Federated — username is stored as user@instance.social.',
    profileUrl: u => {
      // u may be "user@instance.social" or just "user"
      if (u.includes('@')) {
        const [handle, instance] = u.split('@');
        return `https://${instance}/@${handle}`;
      }
      return `https://mastodon.social/@${u}`;
    },
    placeholder: 'yourname@mastodon.social',
    federated: true,
  },
  {
    id: 'nostr',
    name: 'Nostr',
    icon: '◆',
    color: '#7C3AED',
    status: 'planned',
    category: 'decentralized',
    description: 'Nostr — cryptographic decentralized social. npub keys are the identity; NIP-05 identifiers map to domains. Planned for v0.4.',
    profileUrl: u => `https://njump.me/${u}`,
    placeholder: 'npub1... or user@yourdomain.com',
  },
  {
    id: 'farcaster',
    name: 'Farcaster',
    icon: '🟣',
    color: '#8A63D2',
    status: 'planned',
    category: 'decentralized',
    description: 'Farcaster — on-chain social graph, Warpcast client. Strong crypto-native creator base. Planned support via Warpcast profiles.',
    profileUrl: u => `https://warpcast.com/${u}`,
    placeholder: 'yourhandle',
  },

  // ── Creator / developer ────────────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    icon: '⌥',
    color: '#24292F',
    status: 'live',
    category: 'developer',
    description: 'GitHub user and organisation profiles. Enables developer-to-developer tipping.',
    profileUrl: u => `https://github.com/${u}`,
    placeholder: 'yourusername',
  },
  {
    id: 'substack',
    name: 'Substack',
    icon: '✉',
    color: '#FF6719',
    status: 'planned',
    category: 'creator',
    description: 'Substack newsletter authors. Username extracted from {name}.substack.com. Planned as a newsletter handle type.',
    profileUrl: u => `https://${u}.substack.com`,
    placeholder: 'yournewsletter',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '𝕃',
    color: '#0077B5',
    status: 'planned',
    category: 'mainstream',
    description: 'LinkedIn professional profiles at /in/username.',
    profileUrl: u => `https://linkedin.com/in/${u}`,
    placeholder: 'your-name',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a map of platform ID → PlatformDef */
export const PLATFORM_MAP: Record<string, PlatformDef> =
  Object.fromEntries(PLATFORMS.map(p => [p.id, p]));

/** Returns only platforms currently live in the extension */
export const LIVE_PLATFORMS = PLATFORMS.filter(p => p.status === 'live');

/** Returns the icon for a platform ID, with a generic fallback */
export function platformIcon(id: string): string {
  return PLATFORM_MAP[id]?.icon ?? '🔗';
}

/** Returns the profile URL for a platform + username pair */
export function platformProfileUrl(id: string, username: string): string | null {
  const def = PLATFORM_MAP[id];
  if (!def) return null;
  return def.profileUrl(username);
}

/** All platform IDs that are currently live */
export const ALL_PLATFORM_IDS = LIVE_PLATFORMS.map(p => p.id);
