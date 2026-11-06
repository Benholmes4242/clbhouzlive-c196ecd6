/** IN THE CLUBHOUSE — one settled read decides the section exists; a failed
 * read renders nothing. Faces are mutuals for visitors (recent when none),
 * recent on his own view; the 2px ring is the card-colour separator between
 * overlapping faces, never an avatar border. Hidden from visitors at 0
 * followers; his own 0-followers line invites the share. */
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useProClubhouse } from './useProClubhouse';
import { clubhouseCopy, clubhouseFaces } from './proClubhouseRules';

export function ProClubhouseSection({ userId, owner, first }: { userId: string; owner: boolean; first: string }) {
  const query = useProClubhouse(userId);
  const navigate = useNavigate();
  if (!query.isSuccess || query.isError) return null;
  const data = query.data;
  if (!data) return null;
  if (!owner && data.followers === 0) return null;
  const faces = clubhouseFaces(data, owner);
  const copy = clubhouseCopy(data, owner, first);
  return (
    <section data-pro-clubhouse className="pro-profile-section">
      <div className="pro-profile-heading"><h2>IN THE CLUBHOUSE</h2></div>
      <div className="pro-profile-card">
        <div className="pro-clubhouse-sup">
          {faces.length > 0 && (
            <span className="pro-clubhouse-faces">
              {faces.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="pro-clubhouse-face"
                  aria-label={f.name}
                  onClick={() => f.username && navigate(`/profile/${f.username}`)}
                >
                  <SquircleAvatar size={30} hideRing src={f.avatar} alt={f.name} userId={f.id} />
                </button>
              ))}
            </span>
          )}
          <p><b>{copy.bold}</b>{copy.plain}</p>
        </div>
      </div>
    </section>
  );
}
