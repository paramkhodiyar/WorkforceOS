'use client';

import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthProvider';

export default function BackHomeButton() {
  const { user } = useAuth();
  const href = user ? '/dashboard' : '/login';
  const label = user ? '← Back to Dashboard' : '← Back to Login';

  return (
    <Link
      href={href}
      className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-blue-750 transition-colors border border-primary/20 px-3.5 py-2 rounded-xl bg-primary/5 hover:bg-primary/10"
    >
      {label}
    </Link>
  );
}
