'use client';

import { useEffect } from 'react';

type Props = {
  courseId: string;
};

export default function CheckoutClient({ courseId }: Props) {
    const amount = 1;

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://www.paypal.com/sdk/js?client-id=AQf2NUZELsfEAqDt3I03Zk5RppXurJy-z1Z3pMQTcdBrIPGb6Bgs_sGgRPCDv74241I-eEWGTTUULMAM&currency=USD&components=buttons,funding-eligibility';
        script.addEventListener('load', () => {
        if (window.paypal) {
            window.paypal.Buttons({
            createOrder: async () => {
                const res = await fetch('/api/paypal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency: 'USD',
                    description: `Оплата курса ID ${courseId}`,
                }),
                });
                const data = await res.json();
                return data.id;
            },
            onApprove: async (data: unknown, actions: unknown) => {
                alert('Платеж подтвержден!');
            },
            onError: (err: unknown) => {
                console.error('PayPal Error:', err);
                alert('Ошибка оплаты через PayPal');
            },
            }).render('#paypal-button-container');
        }
        });
        document.body.appendChild(script);
    }, [courseId]);

    const handleCryptoPay = async () => {
        const res = await fetch('/api/coinbase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Курс',
            description: `Crypto оплата курса ID ${courseId}`,
            amount: amount,
        }),
        });

        const data = await res.json();
        if (data.hosted_url) {
        window.location.href = data.hosted_url;
        } else {
        alert('Ошибка оплаты криптой');
        }
    };

    return (
        <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Оформлення замовлення</h1>
        <p className="mb-6">Ви оформлюєте курс з ID: {courseId}</p>

        <div className="space-y-4">
            <button
            onClick={handleCryptoPay}
            className="bg-purple-700 text-white py-2 px-4 rounded hover:bg-purple-800"
            >
            💸 Оплатити в криптовалюті (Coinbase)
            </button>

            <div id="paypal-button-container" />
        </div>
        </main>
    );
}
