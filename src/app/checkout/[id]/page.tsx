import { use } from 'react';
import { notFound } from 'next/navigation';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);

  if (!courseId) return notFound();

  return <CheckoutClient courseId={courseId} />;
}
