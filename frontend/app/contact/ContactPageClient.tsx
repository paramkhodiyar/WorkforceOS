'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { LandingFooter } from '../../components/layout/LandingFooter';

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    companySize: '',
    challenge: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.companySize) newErrors.companySize = 'Company size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    // Simulate backend submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-600/10 selection:text-blue-900">
      {/* Navigation Header */}
      <LandingHeader />

      {/* Main split-screen container */}
      <div className="flex-1 flex flex-col md:flex-row pt-16 min-h-[calc(100vh-64px)]">

        {/* LEFT PANEL (40% width, professional muted slate-blue background) */}
        <div className="md:w-[40%] bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col justify-between p-8 md:p-12 text-center md:text-left gap-12 relative overflow-hidden">
          {/* Subtle decoration lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none"></div>

          {/* Top Logo wordmark */}
          <div className="relative z-10 self-center md:self-start">
            <Link
              href="/"
              className="font-extrabold text-2xl tracking-tight text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              WorkforceOS
            </Link>
          </div>

          {/* Central content list */}
          <div className="relative z-10 space-y-8 my-auto max-w-sm mx-auto md:mx-0">
            <div>
              <span
                className="inline-block px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-full mb-4"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                LET'S TALK
              </span>
              <h1
                className="text-2xl md:text-3xl font-[800] text-slate-900 leading-[1.2] tracking-[-0.02em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                See WorkforceOS working for your business.
              </h1>
            </div>

            {/* 3-Step expectation list */}
            <div className="space-y-6">
              {[
                { step: '1', title: 'Fill in the form', desc: "We'll read it today" },
                { step: '2', title: 'We reply', desc: 'Within 24 hours' },
                { step: '3', title: 'Live demo', desc: '30 minutes, no slide decks' }
              ].map((item) => (
                <div key={item.step} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-extrabold shrink-0 select-none">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom links */}
          <div className="relative z-10 border-t border-slate-200/80 pt-6 flex flex-col md:flex-row gap-4 justify-between items-center text-xs text-slate-500">
            <a href="mailto:paramkhodiyar1008@gmail.com" className="hover:text-blue-600 font-bold transition-colors">
              paramkhodiyar1008@gmail.com
            </a>
            <a
              href="https://linkedin.com/in/paramkhodiyar"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 font-bold transition-colors"
            >
              LinkedIn Profile &rarr;
            </a>
          </div>
        </div>

        {/* RIGHT PANEL (60% width, off-white background) */}
        <div className="md:w-[60%] bg-slate-50/50 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-[24px] p-8 sm:p-10">

            {isSuccess ? (
              <div className="text-center py-10 space-y-4 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center select-none mb-2">
                  <span className="material-symbols-outlined text-[28px] font-bold">done</span>
                </div>
                <h3
                  className="text-2xl font-bold text-slate-900"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  We've got your request.
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Expect a reply within 24 hours. We've sent a quick confirmation to your email.
                </p>
                <Link
                  href="/features"
                  className="text-sm font-bold text-blue-600 hover:underline pt-4 block"
                >
                  Browse the full module breakdown &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Tell us about your team
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-1">
                    We read every submission personally.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-155 text-red-700 text-xs rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="text-xs font-bold text-slate-700 uppercase">First Name</label>
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border ${errors.firstName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                        placeholder="Aarav"
                      />
                      {errors.firstName && <span className="text-red-500 text-[11px] block">{errors.firstName}</span>}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="text-xs font-bold text-slate-700 uppercase">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-50 border ${errors.lastName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                        placeholder="Mehta"
                      />
                      {errors.lastName && <span className="text-red-500 text-[11px] block">{errors.lastName}</span>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase">Work Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                      placeholder="aarav@company.in"
                    />
                    {errors.email && <span className="text-red-500 text-[11px] block">{errors.email}</span>}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label htmlFor="companyName" className="text-xs font-bold text-slate-700 uppercase">Company Name</label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      autoComplete="organization"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.companyName ? 'border-red-500' : 'border-slate-200'} focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all`}
                      placeholder="RazorCore Pvt Ltd"
                    />
                    {errors.companyName && <span className="text-red-500 text-[11px] block">{errors.companyName}</span>}
                  </div>

                  {/* Company Size */}
                  <div className="space-y-1">
                    <label htmlFor="companySize" className="text-xs font-bold text-slate-700 uppercase">Company Size</label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border ${errors.companySize ? 'border-red-500' : 'border-slate-200'} focus:border-blue-605 rounded-lg p-3 text-sm text-slate-800 transition-all cursor-pointer`}
                    >
                      <option value="">Select size...</option>
                      <option value="1-20">1–20 employees</option>
                      <option value="21-50">21–50 employees</option>
                      <option value="51-200">51–200 employees</option>
                      <option value="201-500">201–500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                    {errors.companySize && <span className="text-red-500 text-[11px] block">{errors.companySize}</span>}
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1">
                    <label htmlFor="challenge" className="text-xs font-bold text-slate-700 uppercase">Biggest HR Challenge</label>
                    <textarea
                      id="challenge"
                      name="challenge"
                      value={formData.challenge}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-lg p-3 text-sm text-slate-800 transition-all"
                      placeholder="e.g. We track attendance in Excel and leave approvals come on WhatsApp — it breaks down every month-end."
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-full text-sm uppercase tracking-wider border border-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Request a demo</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    No credit card · No commitment · Replies within 24 hours
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Global Navigation Footer */}
      <LandingFooter />
    </div>
  );
}
