import { notFound } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const { id } = params || {};
  if (!id) return notFound();
  return <CheckoutClient courseId={id} />;
}
