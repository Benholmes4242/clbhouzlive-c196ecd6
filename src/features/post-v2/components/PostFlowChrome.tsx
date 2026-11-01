/** Opt-in post-flow chrome; shared composer/review sheet defaults stay frozen. */
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StageCourse } from '../hooks/useStageComposer';
import { useCoursePhoto } from '../hooks/useCoursePhoto';
export function PostFlowHeader({title,onClose}:{title:string;onClose:()=>void}) {
  return <div className="pf-header"><h3>{title}</h3><Button variant="ghost" size="icon" className="pf-close" aria-label="Close" onClick={onClose}><X size={13} strokeWidth={3}/></Button></div>;
}
export function PostCoursePhoto({course,size=52}:{course:StageCourse|null;size?:44|52}) {
  const photo=useCoursePhoto(course);
  return <span className={`pf-photo ${size===44?'pf-photo-small':''}`} data-course-photo={course?.id}>
    {photo?<img src={photo} alt="" loading="lazy"/>:<Flag size={18} strokeWidth={2.2} aria-hidden/>}
  </span>;
}