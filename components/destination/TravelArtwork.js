import Image from 'next/image';
import s from './plans.module.css';
export default function TravelArtwork({mobile = false}){if(mobile)return <img className={s.mobileArtwork} src="/brand/tariff/MORROWGO-mobile-crop.png" width="1170" height="660" alt="" aria-hidden="true"/>;return <div className={s.artworkViewport}><Image className={s.exactArtwork} src="/brand/tariff/MORROWGO-suitcase-monkey-exact-crop.png" width={724} height={1086} sizes="(max-width:724px) 100vw, 724px" alt="" aria-hidden="true" priority/></div>}
