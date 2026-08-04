'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api/client';
import { useToast } from '../../../../lib/toast/ToastProvider';

export default function NewNoticePage() {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ANNOUNCEMENT');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('ALL');
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Formatting helpers for the textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('notice-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || 'text';
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentUrl.trim()) return;

    const name = newAttachmentName.trim() || newAttachmentUrl.split('/').pop() || 'Attachment';
    setAttachments([...attachments, { name, url: newAttachmentUrl.trim() }]);
    setNewAttachmentName('');
    setNewAttachmentUrl('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title.trim()) {
      toast.error('Please enter a notice title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter notice content');
      return;
    }

    setSubmitting(true);
    try {
      await api.knowledge.create({
        title: title.trim(),
        category,
        content: content.trim(),
        visibility,
        isPinned,
        isDraft,
        attachments,
      });

      toast.success(isDraft ? 'Notice saved as draft' : 'Notice published successfully!');
      router.push('/knowledge');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/knowledge"
            className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-headline-sm font-bold text-slate-900">Create New Notice</h1>
            <p className="text-body-xs text-slate-500">Draft and publish company-wide announcements and policy documents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </button>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Notice Title</label>
          <input
            type="text"
            placeholder="e.g. Q3 Updated Remote Work Policy & Guidelines"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 rounded-xl text-title-md font-bold outline-none transition-all"
          />
        </div>

        {/* Category & Visibility Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none"
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="POLICY">HR Policy</option>
              <option value="SAFETY">Health & Safety</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="GENERAL">General Notice</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Target Audience</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none"
            >
              <option value="ALL">All Employees</option>
              <option value="MANAGERS">Managers Only</option>
              <option value="HR">HR Team Only</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 accent-slate-900 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Pin to top of feed</span>
            </label>
          </div>
        </div>

        {/* Rich Text Editor Toolbar & Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Content</label>
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xs"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white italic text-xs font-serif"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('# ')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xs"
                title="Heading"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xs"
                title="Subheading"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- ')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xs"
                title="Bullet list"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[Link Title](', ')')}
                className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xs"
                title="Add Link"
              >
                <span className="material-symbols-outlined text-[16px]">link</span>
              </button>
            </div>
          </div>

          <textarea
            id="notice-editor-textarea"
            rows={14}
            placeholder="Write the details of the notice or announcement here... (Markdown formatting supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 rounded-xl text-body-sm font-medium outline-none transition-all leading-relaxed font-sans"
          />
        </div>

        {/* File / Link Attachments Section */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
            File & Document Attachments
          </label>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">attach_file</span>
                  <a href={att.url} target="_blank" rel="noreferrer" className="hover:underline max-w-[200px] truncate">
                    {att.name}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-all ml-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Attachment Form */}
          <form onSubmit={handleAddAttachment} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Display label (optional)"
              value={newAttachmentName}
              onChange={(e) => setNewAttachmentName(e.target.value)}
              className="sm:w-1/3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
            />
            <input
              type="url"
              placeholder="Attachment file URL or link (e.g. https://...)"
              value={newAttachmentUrl}
              onChange={(e) => setNewAttachmentUrl(e.target.value)}
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Add Link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
