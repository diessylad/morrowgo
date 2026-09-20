'use client';
import Link from 'next/link';
import {ArrowRight,Menu} from 'lucide-react';
import s from './header.module.css';
export default function TariffHeader(){return <header className={s.header}><Link className={s.brand} href="/" aria-label="MORROWGO home"><img src="/brand/tariff/approved-logo.png" alt="MORROWGO" width="348" height="118"/></Link><nav aria-label="Main navigation"><Link href="/account/esims">eSIMs</Link><Link href="/destinations">Destinations</Link><Link href="/#how">About</Link><Link href="/help">Support</Link></nav><div className={s.actions}><Link className={s.download} href="/#product">Download App <ArrowRight size={17}/></Link><details className={s.menu}><summary aria-label="Open navigation"><Menu size={24}/></summary><div><Link href="/account/esims">My eSIMs</Link><Link href="/destinations">Destinations</Link><Link href="/#how">About</Link><Link href="/help">Support</Link><Link href="/account">My account</Link></div></details></div></header>}
