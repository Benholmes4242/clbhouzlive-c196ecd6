/** Player facts omit only missing values; place normalization lives in playerRules. */
import { useTranslation } from 'react-i18next';
import type { TourPlayer } from '../../hooks/useTourHubData';
import { cleanPlace } from '../playerRules';
import { PlayerSection } from './PlayerSection';
export function AboutSection({player}:{player:TourPlayer}) {
 const {t}=useTranslation('tourhub');const birth=player.birth_date?new Date(player.birth_date):null;const now=new Date();
 const age=birth&&!Number.isNaN(birth.getTime())?now.getFullYear()-birth.getFullYear()-(now.getMonth()<birth.getMonth()||now.getMonth()===birth.getMonth()&&now.getDate()<birth.getDate()?1:0):null;
 const inches=player.height?Number.parseFloat(player.height):null;
 const fields=[{key:'age',value:age},{key:'turnedPro',value:player.turned_pro},{key:'height',value:inches&&Number.isFinite(inches)?`${Math.floor(inches/12)}′${Math.round(inches%12)}″`:null},{key:'college',value:player.college},{key:'born',value:cleanPlace(player.birth_place,player.country),place:true},{key:'lives',value:cleanPlace(player.residence,player.country),place:true}].filter(f=>f.value!=null&&f.value!=='');if(!fields.length)return null;
 return <PlayerSection id="about" title={t('player.v3.about')}><div className="pv-about">{fields.map(f=><div key={f.key} data-place={f.place}><small>{t(`player.v3.${f.key}`)}</small><b>{f.value}</b></div>)}</div></PlayerSection>;
}
