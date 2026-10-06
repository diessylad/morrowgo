import Link from '../shared/ReturnAwareLink';
import { ArrowRight } from 'lucide-react';
import { Text } from '../i18n/Provider';
import AccountNavigation from './AccountNavigation';
import brand from '../customer/customer.module.css';
import styles from './account.module.css';
import s from './dashboard.module.css';

export default function AccountSidebar({demo=false}) {
  return <aside className={styles.sidebar}><Link href="/" className={`${brand.brand} ${s.brand}`} aria-label="MORROWGO"><span className={brand.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</Link><AccountNavigation demo={demo}/>
      <Link href="/destinations" className={s.promo}><span><Text>Explore</Text><br/><Text>the world</Text><br/><Text>connected.</Text></span><span className={s.promoArrow}><ArrowRight size={16}/></span><small><Text>Global eSIM for modern travelers</Text></small></Link>
    </aside>;
}
