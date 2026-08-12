/**
 * MatchRequestSheet -- "Played it?" flow for unplayed Top 100 rows.
 * Path 1: review the course (guaranteed credit, awards instantly).
 * Path 2: file a WHS match request for manual alias resolution.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

const FONT = "'SF Pro', -apple-system, sans-serif";
const AMBER = '#F7931E';

interface Props {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

export function MatchRequestSheet({ courseId, courseName, onClose }: Props) {
  const navigate = useNavigate();
  const [whsName, setWhsName] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  const submitRequest = async () => {
    setState('sending');
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) {
      setState('error');
      return;
    }

    // Only email support the FIRST time this user files a match
    // request for this course; silent resubmits keep the row fresh.
    const { data: existing } = await supabase
      .from('whs_course_match_requests')
      .select('id')
      .eq('user_id', uid)
      .eq('golf_course_id', courseId)
      .maybeSingle();
    const isFresh = !existing;

    const trimmedWhs = whsName.trim();
    const { error } = await supabase.from('whs_course_match_requests').upsert(
      {
        user_id: uid,
        golf_course_id: courseId,
        whs_course_name: trimmedWhs || null,
        status: 'pending',
      },
      { onConflict: 'user_id,golf_course_id' },
    );

    if (error) {
      setState('error');
      return;
    }

    if (isFresh) {
      try {
        void supabase.functions.invoke('notify-match-request', {
          body: {
            course_name: courseName,
            whs_course_name: trimmedWhs || undefined,
            course_id: courseId,
            user_email: auth.user.email || undefined,
          },
        });
      } catch (e) {
        console.warn('[match-request] notify failed', e);
      }
    }

    setState('sent');
  };


  const content = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        // Anchor: immersive overlays (AchievementImmersive/LegendImmersive/
        // Top100Immersive) sit at 12500. This sheet must clear them.
        zIndex: 12600,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          borderRadius: '20px 20px 0 0',
          background: '#16191D',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          padding: '8px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          cursor: 'default',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            margin: '0 auto 14px',
          }}
        />

        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            fontFamily: FONT,
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: 8,
          }}
        >
          Played {courseName}?
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.65)',
            fontFamily: FONT,
            marginBottom: 16,
          }}
        >
          WHS course names do not always match ours, so a round you
          have played can be missed. A review always counts -- it is
          matched to this exact course and credits your Top 100
          instantly.
        </div>

        {state === 'sent' ? (
          <div
            style={{
              padding: '14px 12px',
              borderRadius: 12,
              background: 'rgba(247,147,30,0.10)',
              border: '1px solid rgba(247,147,30,0.32)',
              color: '#FBBC2E',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT,
              lineHeight: 1.45,
            }}
          >
            Request sent. Once we match this course to your WHS
            record it will count automatically.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/rate-course-v2/${courseId}`);
              }}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                border: 'none',
                background: AMBER,
                color: '#101418',
                fontSize: 13.5,
                fontWeight: 800,
                fontFamily: FONT,
                cursor: 'pointer',
              }}
            >
              Review this course
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '14px 0',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: FONT,
                }}
              >
                OR
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: FONT,
                marginBottom: 8,
              }}
            >
              It is on my WHS record
            </div>

            <input
              type="text"
              value={whsName}
              onChange={(e) => setWhsName(e.target.value)}
              placeholder="What does your WHS record call it? (optional)"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
                marginBottom: 10,
              }}
            />

            <button
              type="button"
              onClick={submitRequest}
              disabled={state === 'sending'}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: state === 'sending' ? 'default' : 'pointer',
                opacity: state === 'sending' ? 0.6 : 1,
              }}
            >
              {state === 'sending' ? 'Sending...' : 'Request a match'}
            </button>

            {state === 'error' && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: '#F87171',
                  fontFamily: FONT,
                }}
              >
                Could not send the request. Try again in a moment.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

export default MatchRequestSheet;
