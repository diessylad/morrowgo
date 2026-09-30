'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { destinationsHref } from '../../lib/navigation/returnPath.mjs';
// Only Destinations links gain return context; other links retain their behavior.
export default function ReturnAwareLink({ href, ...props }) {
  const pathname = usePathname();
  return <Link {...props} href={href === '/destinations' ? destinationsHref(pathname) : href}/>;
}
