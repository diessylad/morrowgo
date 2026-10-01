import { Text } from '../i18n/Provider';
import s from './experience.module.css';
export function ExperienceCard({ children, className = '', ...props }) {
  return <section className={`${s.card} ${className}`} {...props}>{children}</section>;
}
export function SandboxNote() {
  return <p className={s.sandbox}><Text>Sandbox mode · This purchase is for testing only.</Text></p>;
}
