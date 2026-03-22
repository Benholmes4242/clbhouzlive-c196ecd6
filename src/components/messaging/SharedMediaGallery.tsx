/**
 * SharedMediaGallery - Display shared media, courses, and links
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Image, Link, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

interface LinkItem {
  id: string;
  url: string;
  title?: string;
  createdAt: string;
}

export function SharedMediaGallery({ conversationId, onClose }: SharedMediaGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [courses, setCourses] = useState<MediaItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedContent = async () => {
      setLoading(true);

      try {
        // NOTE: Media gallery only scans the most recent 1000 messages.
        // For very long conversations, older shared media will not appear.
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content, message_type, media_url, media_metadata, created_at')
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .or('message_type.in.(image,video,course_share),media_url.neq.null')
          .order('created_at', { ascending: false })
          .limit(1000);

        const mediaItems: MediaItem[] = [];
        const courseItems: MediaItem[] = [];
        const linkItems: LinkItem[] = [];

        messages?.forEach(msg => {
          if (msg.message_type === 'image' && msg.media_url) {
            mediaItems.push({ id: msg.id, type: 'image', url: msg.media_url, createdAt: msg.created_at });
          } else if (msg.message_type === 'video' && msg.media_url) {
            mediaItems.push({ id: msg.id, type: 'video', url: msg.media_url, createdAt: msg.created_at });
          } else if (msg.message_type === 'course_share' && msg.media_metadata) {
            const meta = msg.media_metadata as Record<string, unknown>;
            courseItems.push({
              id: msg.id, type: 'course',
              url: `/courses/${(meta.course_slug as string) || (meta.course_id as string)}`,
              title: meta.course_name as string, thumbnail: meta.course_image_url as string,
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
        // Silent fail — gallery is non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchSharedContent();
  }, [conversationId]);

  const tabTriggerClass = "flex-1 flex flex-col items-center gap-0 pt-[10px] pb-[10px] rounded-none bg-transparent shadow-none text-[14px] font-medium text-[#94a3b8] relative data-[state=active]:font-bold data-[state=active]:text-[#0f172a] data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=inactive]:text-[#94a3b8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-[2px] after:bg-transparent data-[state=active]:after:bg-[#F5A623]";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        background: '#F8FAFC',
      }}
    >
      {/* Header */}
      <header
        className="flex-none flex items-center px-4 justify-between"
        style={{
          paddingTop: '8px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-[0.97]"
          style={{ background: 'rgba(0,0,0,0.05)' }}
        >
          <ChevronLeft size={20} style={{ color: '#0f172a' }} />
        </button>
        <h1
          className="flex-1 text-center font-bold text-[#0f172a]"
          style={{ fontSize: 17, letterSpacing: '-0.3px' }}
        >
          Shared Media
        </h1>
        <div className="w-9" />
      </header>

      {/* Tabs */}
      <Tabs defaultValue="media" className="flex-1 flex flex-col min-h-0">
        <TabsList
          className="w-full grid grid-cols-3 h-auto rounded-none bg-transparent p-0 shadow-none"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          <TabsTrigger value="media" className={tabTriggerClass}>
            <span className="data-[state=active]:text-[#F5A623] data-[state=inactive]:text-[#94a3b8]">
              <Image className="w-4 h-4" />
            </span>
            Media ({media.length})
          </TabsTrigger>
          <TabsTrigger value="courses" className={tabTriggerClass}>
            <span className="data-[state=active]:text-[#F5A623] data-[state=inactive]:text-[#94a3b8]">
              <MapPin className="w-4 h-4" />
            </span>
            Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="links" className={tabTriggerClass}>
            <span className="data-[state=active]:text-[#F5A623] data-[state=inactive]:text-[#94a3b8]">
              <Link className="w-4 h-4" />
            </span>
            Links ({links.length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#F5A623' }} />
          </div>
        ) : (
          <>
            <TabsContent value="media" className="flex-1 overflow-y-auto p-0 pb-8">
              {media.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-14 h-14 rounded-[14px] mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(245,166,35,0.08)' }}
                  >
                    <Image size={24} style={{ color: '#F5A623' }} />
                  </div>
                  <p className="text-[14px] font-semibold text-[#0f172a]">No media shared yet</p>
                  <p className="text-[13px] text-[#94a3b8] mt-1">Photos and videos will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[2px]">
                  {media.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedImage(item.url)}
                      className="aspect-square overflow-hidden bg-muted/30"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="courses" className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-[10px]">
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-14 h-14 rounded-[14px] mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.08)' }}
                  >
                    <MapPin size={24} style={{ color: '#22c55e' }} />
                  </div>
                  <p className="text-[14px] font-semibold text-[#0f172a]">No courses shared yet</p>
                  <p className="text-[13px] text-[#94a3b8] mt-1">Course shares will appear here</p>
                </div>
              ) : (
                courses.map(course => {
                  const date = new Date(course.createdAt).toLocaleDateString();
                  return (
                    <a
                      key={course.id}
                      href={course.url}
                      className="flex items-center gap-3 px-4 py-3 bg-white rounded-[14px] border border-[rgba(0,0,0,0.07)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      {/* Squircle thumbnail */}
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-11 h-11 object-cover shrink-0"
                          style={{ borderRadius: '34%' }}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 shrink-0 flex items-center justify-center"
                          style={{ borderRadius: '34%', background: 'rgba(34,197,94,0.08)' }}
                        >
                          <span className="text-lg">⛳</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f172a] truncate">
                          {course.title || 'Golf Course'}
                        </p>
                        <p className="text-[12px] text-[#94a3b8] mt-[2px]">{date}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#94a3b8] shrink-0" />
                    </a>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="links" className="flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-[10px]">
              {links.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-14 h-14 rounded-[14px] mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.08)' }}
                  >
                    <Link size={24} style={{ color: '#6366F1' }} />
                  </div>
                  <p className="text-[14px] font-semibold text-[#0f172a]">No links shared yet</p>
                  <p className="text-[13px] text-[#94a3b8] mt-1">Links will appear here</p>
                </div>
              ) : (
                links.map(link => {
                  const date = new Date(link.createdAt).toLocaleDateString();
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-white rounded-[14px] border border-[rgba(0,0,0,0.07)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      <div
                        className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#6366F1' }}
                      >
                        <Link size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#0f172a] truncate">
                          {link.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
                        </p>
                        <p className="text-[12px] text-[#64748b] truncate mt-[2px]">{link.url}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-[2px]">{date}</p>
                      </div>
                      <ExternalLink size={14} className="text-[#94a3b8] shrink-0" />
                    </a>
                  );
                })
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Fullscreen image viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            style={{ marginTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
          >
            <ChevronLeft className="w-6 h-6 text-white rotate-180" />
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
