/**
 * TrustBadge — renders the appropriate label for a TrustLevel value.
 *
 * Use this wherever a trust level needs to be displayed. It replaces the
 * hardcoded "Self-Reported" chip that was embedded in PlatformBadge.
 *
 * Design rules from docs/TRUST_LEVELS.md:
 *  - Never imply a higher trust level than is actually earned
 *  - 'self-reported' must never look "verified"
 *  - 'disputed'/'revoked' must be visually distinct and clear
 *  - Tooltip always explains what the level means
 */

import type { TrustLevel } from '@/lib/types';

interface TrustBadgeProps {
  trustLevel: TrustLevel;
  /** Override the auto-generated tooltip text */
  tooltip?: string;
  /** 'sm' = tiny chip (default), 'md' = slightly larger inline badge */
  size?: 'sm' | 'md';
}

interface LevelConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  tooltip: string;
}

const LEVEL_CONFIG: Record<TrustLevel, LevelConfig> = {
  'self-reported': {
    label: 'Self-Reported',
    color: 'rgba(160,160,160,0.9)',
    bg:    'rgba(136,136,136,0.10)',
    border:'rgba(136,136,136,0.20)',
    tooltip: 'User provided this information themselves. Not independently verified.',
  },
  'challenge-post-verified': {
    label: 'Post Verified',
    color: '#60a5fa',
    bg:    'rgba(96,165,250,0.10)',
    border:'rgba(96,165,250,0.25)',
    tooltip: 'Verified via a public challenge post on the linked platform.',
  },
  'wallet-signature-verified': {
    label: 'Wallet Verified',
    color: '#34d399',
    bg:    'rgba(52,211,153,0.10)',
    border:'rgba(52,211,153,0.25)',
    tooltip: 'Ownership proven by a cryptographic signature from the linked wallet.',
  },
  'community-attested': {
    label: 'Community Attested',
    color: '#a78bfa',
    bg:    'rgba(167,139,250,0.10)',
    border:'rgba(167,139,250,0.25)',
    tooltip: 'Multiple community members have attested to this claim.',
  },
  'project-attested': {
    label: 'Project Verified',
    color: '#f87171',
    bg:    'rgba(248,113,113,0.10)',
    border:'rgba(248,113,113,0.25)',
    tooltip: 'Verified by the ReddID project team.',
  },
  'third-party-credentialed': {
    label: 'Credentialed',
    color: '#2dd4bf',
    bg:    'rgba(45,212,191,0.10)',
    border:'rgba(45,212,191,0.25)',
    tooltip: 'Backed by a verifiable credential from a recognised third-party issuer.',
  },
  'disputed': {
    label: 'Disputed',
    color: '#fb923c',
    bg:    'rgba(251,146,60,0.10)',
    border:'rgba(251,146,60,0.25)',
    tooltip: 'This claim is currently under dispute. Treat with caution.',
  },
  'revoked': {
    label: 'Revoked',
    color: '#f87171',
    bg:    'rgba(239,68,68,0.12)',
    border:'rgba(239,68,68,0.30)',
    tooltip: 'This claim or credential has been revoked and is no longer valid.',
  },
};

export default function TrustBadge({ trustLevel, tooltip, size = 'sm' }: TrustBadgeProps) {
  const cfg = LEVEL_CONFIG[trustLevel] ?? LEVEL_CONFIG['self-reported'];
  const title = tooltip ?? cfg.tooltip;

  const fontSize = size === 'md' ? '0.7rem' : '0.6rem';
  const padding  = size === 'md' ? '1px 6px' : '0px 4px';

  return (
    <span
      title={title}
      style={{
        fontSize,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 3,
        padding,
        letterSpacing: '0.04em',
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {cfg.label}
    </span>
  );
}
