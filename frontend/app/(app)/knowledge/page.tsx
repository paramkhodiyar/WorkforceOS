'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';

export default function KnowledgePage() {
  const toast = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  async function loadData() {
    try {
      const res = await api.knowledge.list();
      setArticles(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleViewArticle(id: string) {
    try {
      const res = await api.knowledge.get(id);
      setSelectedArticle(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch article content');
    }
  }

  const filteredArticles = articles.filter(art => {
    const title = art.title.toLowerCase();
    const cat = art.category.toLowerCase();
    const query = search.toLowerCase();
    return title.includes(query) || cat.includes(query);
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Policies & Handbook</h1>
        <p className="text-body-sm text-outline">Search and read corporate documents and compliance articles</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search policies by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {filteredArticles.length === 0 ? (
          <p className="text-body-sm text-outline py-8 text-center">No articles match your query.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredArticles.map(art => (
              <div
                key={art.id}
                onClick={() => handleViewArticle(art.id)}
                className="p-5 bg-surface-container-low border border-outline-variant hover:border-outline hover:shadow-sm rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="bg-primary-container text-on-primary-container text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-primary-container/20">
                    {art.category}
                  </span>
                  <h3 className="text-label-md font-bold text-on-surface mt-3 line-clamp-2">{art.title}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant flex items-center justify-between text-outline text-[11px]">
                  <span>By {art.author?.firstName || 'System'}</span>
                  <span className="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedArticle && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-6">
              <div>
                <span className="bg-primary-container text-on-primary-container text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                  {selectedArticle.category}
                </span>
                <h2 className="text-headline-sm font-bold text-on-surface mt-2">{selectedArticle.title}</h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 hover:bg-surface-container rounded-full shrink-0 self-start"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="prose max-w-none text-body-sm text-on-surface-variant leading-relaxed space-y-4">
              {selectedArticle.content.split('\n\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-outline-variant flex justify-between items-center text-[11px] text-outline">
              <span>Author: {selectedArticle.author?.firstName} {selectedArticle.author?.lastName}</span>
              <span>Updated: {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
