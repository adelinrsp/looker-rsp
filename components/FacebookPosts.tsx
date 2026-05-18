
import React, { useState, useEffect, useMemo } from 'react';
import { fetchSocialFeed, SocialPost } from '../services/facebookAdsService';
import SocialCalendarView from './SocialCalendarView';

const FacebookPosts: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'facebook' | 'instagram'>('all');
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSocialFeed();
        setPosts(data);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPosts();
  }, []);

  const hasInstagram = useMemo(() => posts.some(p => p.platform === 'instagram'), [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter(post => {
        const matchesSearch = (post.message || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
        return matchesSearch && matchesPlatform;
      })
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
  }, [posts, searchTerm, platformFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const StatCard = ({ label, value, unit = '', icon, color = 'slate' }: { label: string; value: number | string; unit?: string; icon: string; color?: string }) => {
    const colorClasses = {
      slate: 'bg-slate-50 text-slate-900',
      blue: 'bg-blue-50 text-blue-900',
      emerald: 'bg-emerald-50 text-emerald-900',
      amber: 'bg-amber-50 text-amber-900',
      rose: 'bg-rose-50 text-rose-900'
    };

    return (
      <div className={`${colorClasses[color as keyof typeof colorClasses]} p-6 rounded-2xl`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          <i className={`fas ${icon} text-${color}-600 text-sm`}></i>
        </div>
        <p className="text-3xl font-black text-slate-900 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="relative w-64">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-100 rounded-[22px] shadow-sm text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${platformFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setPlatformFilter('facebook')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${platformFilter === 'facebook' ? 'bg-[#1877F2] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setPlatformFilter('instagram')}
              disabled={!isLoading && !hasInstagram}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${platformFilter === 'instagram' ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <i className="fab fa-instagram"></i>
              <span>Instagram</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm mb-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-th-large"></i>
              <span>Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-list"></i>
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${viewMode === 'calendar' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Calendrier</span>
            </button>
          </div>
          {!isLoading && !hasInstagram && (
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg">
              <i className="fas fa-exclamation-triangle mr-1"></i> Instagram non détecté ou permissions manquantes
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-16 h-16 border-[6px] border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Récupération du flux social...</p>
        </div>
      ) : filteredPosts.length > 0 ? (
        <>
          {viewMode === 'calendar' ? (
            <SocialCalendarView posts={filteredPosts} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    {post.full_picture ? (
                      <img src={post.full_picture} alt="Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                        <i className="fas fa-file-alt text-6xl opacity-20"></i>
                        <span className="text-[8px] font-black uppercase mt-4 tracking-widest">Post Texte</span>
                      </div>
                    )}

                    {post.isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
                          <i className="fas fa-play text-white text-sm ml-1"></i>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-5 right-5">
                      <div className={`w-8 h-8 ${post.platform === 'facebook' ? 'bg-[#1877F2]' : 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]'} text-white rounded-lg flex items-center justify-center shadow-xl`}>
                        <i className={`fab fa-${post.platform === 'facebook' ? 'facebook-f' : 'instagram'} text-sm`}></i>
                      </div>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{formatDate(post.created_time)}</p>
                      <h4 className="text-sm font-bold text-slate-900 leading-relaxed line-clamp-3 min-h-[60px]">
                        {post.message || <span className="italic text-slate-300">Sans texte...</span>}
                      </h4>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex space-x-6">
                        <div className="flex items-center space-x-2">
                          <i className={`fas fa-${post.platform === 'facebook' ? 'thumbs-up' : 'heart'} ${post.platform === 'facebook' ? 'text-[#1877F2]' : 'text-[#ee2a7b]'} text-xs`}></i>
                          <span className="text-xs font-black text-slate-900">{post.likes_count}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-comment text-slate-400 text-xs"></i>
                          <span className="text-xs font-black text-slate-900">{post.comments_count}</span>
                        </div>
                      </div>
                      <i className="fas fa-external-link-alt text-slate-200 group-hover:text-amber-500 transition-colors"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all p-8 cursor-pointer group"
                >
                  <div className="flex items-start space-x-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                      {post.full_picture ? (
                        <img src={post.full_picture} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                          <i className="fas fa-file-alt text-2xl opacity-20"></i>
                        </div>
                      )}
                      {post.isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <i className="fas fa-play text-white text-sm"></i>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {formatDate(post.created_time)} • {post.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                          </p>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                            {post.message || <span className="italic text-slate-300">Sans texte...</span>}
                          </h4>
                        </div>
                        <a
                          href={post.permalink_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-amber-500 transition-all flex-shrink-0 ml-4"
                        >
                          <i className="fas fa-external-link-alt text-xs"></i>
                        </a>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <StatCard label="Impressions" value={post.impressions || 0} icon="fa-eye" color="blue" />
                        <StatCard label="Portée" value={post.reach || 0} icon="fa-share-alt" color="emerald" />
                        <StatCard label="Engagement" value={post.engagement_rate?.toFixed(1) || 0} unit="%" icon="fa-chart-line" color="amber" />
                        <StatCard label="Clics" value={post.clicks || 0} icon="fa-mouse" color="rose" />
                      </div>

                      <div className="flex items-center space-x-8 mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center space-x-2">
                          <i className={`fas fa-${post.platform === 'facebook' ? 'thumbs-up' : 'heart'} ${post.platform === 'facebook' ? 'text-[#1877F2]' : 'text-[#ee2a7b]'}`}></i>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Réactions</p>
                            <p className="text-lg font-black text-slate-900">{post.reactions || post.likes_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-comment text-slate-400"></i>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Commentaires</p>
                            <p className="text-lg font-black text-slate-900">{post.comments_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="fas fa-share text-slate-400"></i>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Partages</p>
                            <p className="text-lg font-black text-slate-900">{post.shares?.count || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-24 text-center">
          <i className="fas fa-search text-slate-200 text-4xl mb-4"></i>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Aucune publication trouvée</p>
        </div>
      )}

      {/* Modale de détails */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-[48px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {formatDate(selectedPost.created_time)} • {selectedPost.platform === 'facebook' ? 'Facebook' : 'Instagram'}
                  </p>
                  <h2 className="text-2xl font-black text-slate-900">
                    {selectedPost.message || <span className="italic text-slate-300">Post sans texte</span>}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {selectedPost.full_picture && (
                <div className="w-full rounded-2xl overflow-hidden bg-slate-100">
                  <img src={selectedPost.full_picture} alt="Post" className="w-full h-auto" />
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900 mb-4">Métriques de performance</h3>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Impressions" value={selectedPost.impressions || 0} icon="fa-eye" color="blue" />
                  <StatCard label="Portée" value={selectedPost.reach || 0} icon="fa-share-alt" color="emerald" />
                  <StatCard label="Réactions" value={selectedPost.reactions || selectedPost.likes_count} icon="fa-heart" color="rose" />
                  <StatCard label="Commentaires" value={selectedPost.comments_count} icon="fa-comment" color="slate" />
                  <StatCard label="Partages" value={selectedPost.shares?.count || 0} icon="fa-share" color="amber" />
                  <StatCard label="Clics" value={selectedPost.clicks || 0} icon="fa-mouse" color="blue" />
                  <StatCard label="Taux d'engagement" value={selectedPost.engagement_rate?.toFixed(2) || 0} unit="%" icon="fa-chart-line" color="amber" />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-100">
                <a
                  href={selectedPost.permalink_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-external-link-alt"></i>
                  <span>Voir le post</span>
                </a>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookPosts;
