/**
 * SharedMediaGallery - Display shared media, courses, and links
 * Phase 3 redesign
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image, Link, MapPin, Loader2, ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SharedMediaGalleryProps {
  conversationId: string;
  onClose: () => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'course';
  url: string;
  thumbnail?: string;
  title?: string;
  createdAt: string;
}

interface CourseItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  location?: string;
  rating?: number;
  createdAt: string;
}

interface LinkItem {
  id: string;
  url: string;
  title?: string;
  createdAt: string;
}

type TabKey = 'media' | 'courses' | 'links';

export function SharedMediaGallery({ conversationId, onClose }: SharedMediaGalleryProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('media');

  useEffect(() => {
    const fetchSharedContent = async () => {
      setLoading(true);
      try {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, message_type, media_url, media_metadata, created_at')
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .or('message_type.in.(image,video,course_share),media_url.neq.null')
          .order('created_at', { ascending: false })
          .limit(1000);

        const mediaItems: MediaItem[] = [];
        const courseItems: CourseItem[] = [];
        const linkItems: LinkItem[] = [];

        messages?.forEach(msg => {
          if (msg.message_type === 'image' && msg.media_url) {
            mediaItems.push({ id: msg.id, type: 'image', url: msg.media_url, createdAt: msg.created_at });
          } else if (msg.message_type === 'video' && msg.media_url) {
            mediaItems.push({ id: msg.id, type: 'video', url: msg.media_url, createdAt: msg.created_at });
          } else if (msg.message_type === 'course_share' && msg.media_metadata) {
            const meta = msg.media_metadata as Record<string, unknown>;
            courseItems.push({
              id: msg.id,
              url: `/courses/${(meta.course_slug as string) || (meta.course_id as string)}`,
              title: (meta.course_name as string) || 'Golf Course',
              thumbnail: meta.course_image_url as string | undefined,
              location: meta.location as string | undefined,
              rating: meta.rating as number | undefined,
              createdAt: msg.created_at,
            });
          }
          if (msg.content) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = msg.content.match(urlRegex);
            urls?.forEach(url => {
              linkItems.push({ id: `${msg.id}-${url}`, url, createdAt: msg.created_at });
            });
          }
        });

        setMedia(mediaItems);
        setCourses(courseItems);
        setLinks(linkItems);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchSharedContent();
  }, [conversationId]);

  const tabs: { key: TabKey; label: string; count: number; icon: typeof Image; activeColor: string }[] = [
    { key: 'media', label: 'Media', count: media.length, icon: Image, activeColor: '#0f172a' },
    { key: 'courses', label: 'Courses', count: courses.length, icon: MapPin, activeColor: '#006747' },
    { key: 'links', label: 'Links', count: links.length, icon: Link, activeColor: '#6366f1' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#F8FAFC' }}
    >
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
          paddingBottom: 10,
          paddingLeft: 16, paddingRight: 16,
          background: '#F8FAFC',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center justify-center active:scale-[0.97] transition-transform flex-shrink-0"
          style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)' }}
        >
          <ChevronLeft size={20} style={{ color: '#475569' }} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-center" style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Shared Media
        </h1>
        <div style={{ width: 34 }} />
      </header>

      {/* Tab bar */}
      <div
        className="flex flex-shrink-0"
        style={{ background: '#fff', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;
          const iconColor = isActive ? tab.activeColor : '#94a3b8';
          const textColor = isActive ? '#0f172a' : '#94a3b8';
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex flex-col items-center relative"
              style={{
                gap: 3, padding: '12px 8px 10px',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <IconComponent size={15} style={{ color: iconColor }} />
              <span style={{ fontSize: '12.5px', fontWeight: isActive ? 700 : 500, color: textColor }}>
                {tab.label} ({tab.count})
              </span>
              {/* Underline */}
              <div
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, borderRadius: '2px 2px 0 0',
                  background: isActive ? '#F7931E' : 'transparent',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#F7931E' }} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Media tab */}
          {activeTab === 'media' && (
            media.length === 0 ? (
              <EmptyState icon={Image} iconColor="#F7931E" iconBg="rgba(247,147,30,0.10)" title="No media shared yet" subtitle="Photos and videos will appear here" />
            ) : (
              <div className="grid grid-cols-3" style={{ gap: 3, padding: 16 }}>
                {media.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedImage(item.url)}
                    className="overflow-hidden"
                    style={{ aspectRatio: '1', borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )
          )}

          {/* Courses tab */}
          {activeTab === 'courses' && (
            courses.length === 0 ? (
              <EmptyState icon={MapPin} iconColor="#006747" iconBg="rgba(0,103,71,0.07)" title="No courses shared yet" subtitle="Course shares will appear here" />
            ) : (
              <div className="flex flex-col" style={{ gap: 10, padding: 16 }}>
                {courses.map(course => (
                  <button
                    key={course.id}
                    onClick={() => navigate(course.url)}
                    className="w-full flex items-center text-left active:opacity-80 transition-opacity"
                    style={{
                       gap: 12, padding: '10px 14px', borderRadius: 14,
                      background: '#fff', border: '1px solid rgba(15,23,42,0.07)',
                      cursor: 'pointer',
                    }}
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="flex-shrink-0 object-cover"
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(0,103,71,0.07)' }}
                      >
                        <span className="text-lg">⛳</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {course.title}
                      </p>
                      {course.location && (
                        <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                          <MapPin size={11} style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{course.location}</span>
                        </div>
                      )}
                    </div>
                    {course.rating && course.rating > 0 && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#F7931E' }}>⭐ {course.rating.toFixed(1)}</span>
                    )}
                    <ChevronRight size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )
          )}

          {/* Links tab */}
          {activeTab === 'links' && (
            links.length === 0 ? (
              <EmptyState icon={Link} iconColor="#6366f1" iconBg="rgba(99,102,241,0.10)" title="No links shared yet" subtitle="Links will appear here" />
            ) : (
              <div className="flex flex-col" style={{ gap: 10, padding: 16 }}>
                {links.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                    style={{
                      gap: 12, padding: '10px 14px', borderRadius: 14,
                      background: '#fff', border: '1px solid rgba(15,23,42,0.07)',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                      }}
                    >
                      <Link size={16} style={{ color: '#6366f1' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {link.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                      </p>
                      <p className="truncate" style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{link.url}</p>
                    </div>
                    <ExternalLink size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Fullscreen image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute flex items-center justify-center"
            style={{
              top: 'max(env(safe-area-inset-top, 0px), 16px)', right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
            }}
          >
            <X size={20} style={{ color: '#fff' }} />
          </button>
          <img
            src={selectedImage}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

/* ── Empty state helper ── */
function EmptyState({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}: {
  icon: typeof Image;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: '60px 24px' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 56, height: 56, borderRadius: 16, background: iconBg, marginBottom: 12 }}
      >
        <Icon size={24} style={{ color: iconColor }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{subtitle}</p>
    </div>
  );
}
