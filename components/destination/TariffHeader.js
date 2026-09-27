'use client';
import { Text, Localized } from './../i18n/Provider';
import LanguageSelect from '../i18n/LanguageSelect';
import en from './../../locales/en.json';
import Link from 'next/link';
import {ArrowRight,Menu} from 'lucide-react';
import s from './header.module.css';
export default function TariffHeader(){return <header className={s.header}><Link className={s.brand} href="/" aria-label={en["m_43350ea9c5ee"]}><Localized as="img" src="/brand/tariff/approved-logo.png" alt="MORROWGO" width="348" height="118"/></Link><Localized as="nav" aria-label={en["m_efd197f3fce4"]}><Link href="/account/esims"><Text>{en["m_87337f75a0f1"]}</Text></Link><Link href="/destinations"><Text>{en["m_0fc66bc4363c"]}</Text></Link><Link href="/#how"><Text>{en["m_6b21fb791ac0"]}</Text></Link><Link href="/help"><Text>{en["m_f32d5a3b17e6"]}</Text></Link></Localized><div className={s.actions}><LanguageSelect/><Link className={s.download} href="/#product"><Text>{en["m_58cb969e6dd0"]}</Text><ArrowRight size={17}/></Link><details className={s.menu}><Localized as="summary" aria-label={en["m_0f53b30706b1"]}><Menu size={24}/></Localized><div><Link href="/account/esims"><Text>{en["m_7bf740d405dc"]}</Text></Link><Link href="/destinations"><Text>{en["m_0fc66bc4363c"]}</Text></Link><Link href="/#how"><Text>{en["m_6b21fb791ac0"]}</Text></Link><Link href="/help"><Text>{en["m_f32d5a3b17e6"]}</Text></Link><Link href="/account"><Text>{en["m_619098172f46"]}</Text></Link></div></details></div></header>}
