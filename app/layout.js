import '../components/i18n/responsive.css';
import LanguageProvider from '../components/i18n/Provider';
import CookieConsent from '../components/privacy/CookieConsent';
import './globals.css';

export const metadata = {
  title: 'MORROWGO — Travel eSIM',
  description: 'Affordable travel eSIMs. Stay connected wherever you go.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><LanguageProvider><CookieConsent>{children}</CookieConsent></LanguageProvider></body></html>;
}
