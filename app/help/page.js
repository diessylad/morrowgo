import { Text } from './../../components/i18n/Provider';
import en from './../../locales/en.json';
import Link from 'next/link';
import styles from '../../components/customer/customer.module.css';
import Header from '../../components/customer/Header';
export const metadata = { title: 'Help & FAQ | MORROWGO' };
const faq = [
  [en["m_938b76ee83e3"], en["m_89ef034ce3ed"]],
  [en["m_a052f5721568"], en["m_6323769ae5ce"]],
  [en["m_c3dd337f9164"], en["m_71753cc387e5"]],
  [en["m_f10633f4b962"], en["m_1d7bacd41266"]],
  [en["m_2d0e6dfd9c6e"], en["m_8661d7cfda2a"]],
  [en["m_2be81bd85b28"], en["m_4b2c9e59ab64"]],
  [en["m_067cfb94a3ba"], en["m_dcdf7020fb84"]],
  [en["m_3b7aa22e6045"], en["m_53882956f239"]]
];
const sections = [[en["m_76e7a3a3f9c2"],[faq[0]]],[en["m_c81b79df3c64"],[faq[4],faq[5]]],[en["m_1b770f3fc19d"],[faq[1],faq[2],faq[3],faq[7]]],[en["m_211da89c5fa6"],[faq[6]]],[en["m_1d6e4537b922"],[[en["m_074bc363c57d"],en["m_cfde6fa2a0bc"]]]],[en["m_285ec850c11d"],[[en["m_75f5b76c935a"],en["m_527dd55c9a2c"]]]]];
export default function Help() { return <div className={styles.page}><Header/><main className={styles.wrap}><span className={styles.label}><Text>{en["m_0e5b114f4724"]}</Text></span><h1 className={styles.title}><Text>{en["m_c90da7fe3ca7"]}</Text></h1><p className={styles.intro}><Text>{en["m_ffb265fa0d38"]}</Text><br/><Text>{en["m_67045186f732"]}</Text></p><Text>{sections.map(([title,items])=><section key={title} className={styles.faqSection}><h2><Text>{title}</Text></h2><div className={styles.faq}><Text>{items.map(([q,a])=><details key={q}><summary><Text>{q}</Text></summary><p><Text>{a}</Text></p></details>)}</Text></div></section>)}</Text><section id="contact" className={styles.contact}><h2><Text>{en["m_25e6e3e3abd1"]}</Text></h2><p><Text>{en["m_d923e102ad3d"]}</Text></p><a className={styles.button} href="mailto:support@morrowgo.com"><Text>{en["m_0b138424bdf4"]}</Text></a></section></main></div>; }
