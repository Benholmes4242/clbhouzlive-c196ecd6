 /**
  * SharedMediaGallery - Display shared media, courses, and links
  */
 
 import { useState, useEffect } from 'react';
 import { ChevronLeft, Image, Link, MapPin, Loader2 } from 'lucide-react';
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
         // Fetch messages with media
         const { data: messages } = await supabase
           .from('messages')
           .select('id, content, message_type, media_url, media_metadata, created_at')
           .eq('conversation_id', conversationId)
           .is('deleted_at', null)
           .or('message_type.in.(image,video,course_share),media_url.neq.null')
           .order('created_at', { ascending: false });
 
         const mediaItems: MediaItem[] = [];
         const courseItems: MediaItem[] = [];
         const linkItems: LinkItem[] = [];
 
         messages?.forEach(msg => {
           if (msg.message_type === 'image' && msg.media_url) {
             mediaItems.push({
               id: msg.id,
               type: 'image',
               url: msg.media_url,
               createdAt: msg.created_at,
             });
           } else if (msg.message_type === 'video' && msg.media_url) {
             mediaItems.push({
               id: msg.id,
               type: 'video',
               url: msg.media_url,
               createdAt: msg.created_at,
             });
           } else if (msg.message_type === 'course_share' && msg.media_metadata) {
             const meta = msg.media_metadata as any;
             courseItems.push({
               id: msg.id,
               type: 'course',
               url: `/courses/${meta.course_slug || meta.course_id}`,
               title: meta.course_name,
               thumbnail: meta.course_image_url,
               createdAt: msg.created_at,
             });
           }
 
           // Extract links from text messages
           if (msg.content) {
             const urlRegex = /(https?:\/\/[^\s]+)/g;
             const urls = msg.content.match(urlRegex);
             urls?.forEach(url => {
               linkItems.push({
                 id: `${msg.id}-${url}`,
                 url,
                 createdAt: msg.created_at,
               });
             });
           }
         });
 
         setMedia(mediaItems);
         setCourses(courseItems);
         setLinks(linkItems);
       } catch (error) {
         console.error('Error fetching shared content:', error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchSharedContent();
   }, [conversationId]);
 
  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col">
       {/* Header */}
       <div className="flex items-center h-14 px-4 border-b border-[#E5E5EA]">
         <button
           onClick={onClose}
           className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-[#F5F5F5]"
         >
           <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
         </button>
         <h1 className="flex-1 text-center text-lg font-semibold">
           Media, Links, and Courses
         </h1>
         <div className="w-10" />
       </div>
 
       {/* Tabs */}
       <Tabs defaultValue="media" className="flex-1 flex flex-col">
         <TabsList className="mx-4 mt-4 grid grid-cols-3 h-10 bg-[#F5F5F5] rounded-full p-1">
           <TabsTrigger 
             value="media" 
             className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
           >
             <Image className="w-4 h-4 mr-1" />
             Media ({media.length})
           </TabsTrigger>
           <TabsTrigger 
             value="courses"
             className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
           >
             <MapPin className="w-4 h-4 mr-1" />
             Courses ({courses.length})
           </TabsTrigger>
           <TabsTrigger 
             value="links"
             className="rounded-full text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
           >
             <Link className="w-4 h-4 mr-1" />
             Links ({links.length})
           </TabsTrigger>
         </TabsList>
 
         {loading ? (
           <div className="flex-1 flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-[#8E8E93] animate-spin" />
           </div>
         ) : (
           <>
             <TabsContent value="media" className="flex-1 overflow-y-auto p-4">
               {media.length === 0 ? (
                 <div className="text-center py-12 text-[#8E8E93]">
                   <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                   <p>No media shared yet</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-3 gap-1">
                   {media.map(item => (
                     <button
                       key={item.id}
                       onClick={() => setSelectedImage(item.url)}
                       className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]"
                     >
                       {item.type === 'image' ? (
                         <img 
                           src={item.url} 
                           alt="" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <video 
                           src={item.url} 
                           className="w-full h-full object-cover"
                         />
                       )}
                     </button>
                   ))}
                 </div>
               )}
             </TabsContent>
 
             <TabsContent value="courses" className="flex-1 overflow-y-auto p-4 space-y-3">
               {courses.length === 0 ? (
                 <div className="text-center py-12 text-[#8E8E93]">
                   <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                   <p>No courses shared yet</p>
                 </div>
               ) : (
                 courses.map(course => (
                   <a
                     key={course.id}
                     href={course.url}
                     className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F5] hover:bg-[#E5E5EA]"
                   >
                     {course.thumbnail ? (
                       <img 
                         src={course.thumbnail} 
                         alt={course.title}
                         className="w-16 h-16 rounded-lg object-cover"
                       />
                     ) : (
                       <div className="w-16 h-16 rounded-lg bg-[#2A9D5C] flex items-center justify-center">
                         <span className="text-2xl">⛳</span>
                       </div>
                     )}
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-[#1D1D1F] truncate">
                         {course.title || 'Golf Course'}
                       </p>
                       <p className="text-sm text-[#8E8E93]">
                         {new Date(course.createdAt).toLocaleDateString()}
                       </p>
                     </div>
                   </a>
                 ))
               )}
             </TabsContent>
 
             <TabsContent value="links" className="flex-1 overflow-y-auto p-4 space-y-2">
               {links.length === 0 ? (
                 <div className="text-center py-12 text-[#8E8E93]">
                   <Link className="w-12 h-12 mx-auto mb-2 opacity-50" />
                   <p>No links shared yet</p>
                 </div>
               ) : (
                 links.map(link => (
                   <a
                     key={link.id}
                     href={link.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="block p-3 rounded-2xl bg-[#F5F5F5] hover:bg-[#E5E5EA]"
                   >
                     <p className="text-[#2A9D5C] truncate text-sm">
                       {link.url}
                     </p>
                     <p className="text-xs text-[#8E8E93] mt-1">
                       {new Date(link.createdAt).toLocaleDateString()}
                     </p>
                   </a>
                 ))
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