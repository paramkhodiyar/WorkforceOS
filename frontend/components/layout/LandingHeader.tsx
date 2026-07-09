'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthProvider';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const homeHref = user ? '/dashboard' : '/';
  const isHomepage = pathname === '/';

  useEffect(() => {
    if (!isHomepage) {
      setScrolled(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomepage]);

  // Handle body scroll locking when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 flex items-center justify-between px-6 md:px-12 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-slate-200'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Left Side: Brand Wordmark */}
        <Link 
          href={homeHref} 
          className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 font-sans cursor-pointer hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <img 
            src="/workforceoslogo.png" 
            alt="WorkforceOS Logo" 
            className="h-8 w-8 object-cover object-center scale-110 rounded" 
          />
          <span>WorkforceOS</span>
        </Link>

        {/* Right Side: Desktop Nav links & CTA */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-semibold tracking-wide transition-colors hover:text-blue-600 ${
                pathname === link.href ? 'text-blue-600' : 'text-slate-600/80 hover:text-slate-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            id="nav-cta-btn"
            href="/contact"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full px-6 py-2.5 transition-all border border-blue-600 active:scale-95 cursor-pointer inline-flex items-center justify-center"
          >
            Request a demo
          </Link>
        </nav>

        {/* Mobile Hamburger Icon */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex flex-col justify-between w-[22px] h-[19px] bg-transparent border-0 cursor-pointer focus:outline-none p-0 z-50"
          aria-label="Open navigation menu"
        >
          <span className="w-full h-[3px] bg-slate-900 rounded-sm"></span>
          <span className="w-full h-[3px] bg-slate-900 rounded-sm"></span>
          <span className="w-full h-[3px] bg-slate-900 rounded-sm"></span>
        </button>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col p-6 animate-slide-in-right"
          style={{ animationName: 'slide-in-right' }}
        >
          {/* Header row inside Mobile menu */}
          <div className="flex items-center justify-between h-16">
            <Link
              href={homeHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <img 
                src="/workforceoslogo.png" 
                alt="WorkforceOS Logo" 
                className="h-8 w-8 object-cover object-center scale-110 rounded" 
              />
              <span>WorkforceOS</span>
            </Link>
            
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-[44px] h-[44px] bg-transparent border-0 cursor-pointer text-slate-900 focus:outline-none"
              aria-label="Close navigation menu"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>

          {/* Links & CTA inside overlay */}
          <div className="flex-1 flex flex-col justify-center items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold text-slate-900 hover:text-blue-600 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pb-12 pt-6">
            <Link
              id="mobile-nav-cta-btn"
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-full py-4 text-center block transition-all active:scale-95 cursor-pointer"
            >
              Request a demo
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
