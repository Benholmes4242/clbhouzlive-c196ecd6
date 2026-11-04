import './pro-label.css';
export function ProfileProNote({ tour }: { tour?: string | null }) {
  return <div className="pro-profile-note"><i aria-hidden="true" /><div><b>{tour ? `Your ${tour} rounds will show here` : 'Pro verification: being checked'}</b>{tour ? `As soon as we connect with the ${tour}, your results and rounds appear here automatically. Only you can see this until then.` : "Your PRO label appears here once we've checked. Only you can see this."}</div></div>;
}