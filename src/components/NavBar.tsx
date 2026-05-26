'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, PenLine, Map, BarChart2, BookOpen, Menu, X, ArrowLeftRight, Users, Zap, Layers } from 'lucide-react';

const NAV_LINKS = [
  { href: '/',          label: 'Home',      Icon: Home },
  { href: '/register',  label: 'Register',  Icon: PenLine },
  { href: '/explore',   label: 'Explore',   Icon: Users },
  { href: '/platforms', label: 'Platforms', Icon: Layers },
  { href: '/bridge',    label: 'Bridge',    Icon: ArrowLeftRight },
  { href: '/staking',   label: 'Staking',   Icon: Zap },
  { href: '/roadmap',   label: 'Roadmap',   Icon: Map },
  { href: '/reserve',   label: 'Reserve',   Icon: BarChart2 },
  { href: '/docs',      label: 'Docs',      Icon: BookOpen },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span
            style={{
              background: 'var(--redd-red)',
              color: 'white',
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 700,
              fontSize: '0.78rem',
              letterSpacing: '0.14em',
              padding: '3px 8px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}
          >
            REDD
          </span>
          <span style={{ color: 'var(--text-primary)', fontFamily: "'Rubik', sans-serif", fontWeight: 600, fontSize: '1rem' }}>
            ID Next
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              background: 'rgba(227,6,19,0.1)',
              color: 'var(--redd-red-light)',
              border: '1px solid rgba(227,6,19,0.2)',
              padding: '1px 6px',
              borderRadius: 4,
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            v0.4 beta
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 2 }} className="hidden-mobile">
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  color: active ? 'var(--redd-red)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: '0.85rem',
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: active ? 'var(--redd-red-pale)' : 'transparent',
                  border: active ? '1px solid var(--redd-red-border)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '6px',
            display: 'none',
            lineHeight: 0,
          }}
          className="show-mobile"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '8px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {NAV_LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  color: active ? 'var(--redd-red)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: '0.95rem',
                  padding: '11px 4px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
