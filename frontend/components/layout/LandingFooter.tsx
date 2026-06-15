'use client';

import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100/80 border-t border-slate-200/60 py-12 px-6 md:px-12 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Left Side: Brand & Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/workforceoslogo.png" 
            alt="WorkforceOS Logo" 
            className="h-6 w-6 object-contain rounded" 
          />
          <span 
            className="font-extrabold text-sm tracking-wider text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            WorkforceOS
          </span>
        </div>

        {/* Center / Right Side: Legal Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500 font-semibold">
          <Link href="/disclaimer" className="hover:text-blue-600 transition-colors">
            Disclaimer
          </Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/cookie-policy" className="hover:text-blue-600 transition-colors">
            Cookie Policy
          </Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-[10px] text-slate-400 font-medium">
          &copy; {currentYear} WorkforceOS. Designed for premium compliance operations.
        </p>
      </div>
    </footer>
  );
}
