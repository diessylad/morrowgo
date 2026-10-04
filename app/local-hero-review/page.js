import { notFound } from 'next/navigation';
import HeroReview from '../../components/hero-review/HeroReview';
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <HeroReview/>;
}
