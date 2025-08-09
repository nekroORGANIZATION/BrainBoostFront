'use client';

import { useState } from 'react';
import RoleSelection from '@/app/register/RoleSelection';
import UserDetailsForm from '@/app/register/UserDetailsForm';
import BirthDateForm from '@/app/register/BirthDateForm';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: '',
        name: '',
        email: '',
        password: '',
        birthDate: '',
    });

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const updateData = (data: Partial<typeof formData>) => {
        setFormData({ ...formData, ...data });
    };

    return (
        <>
        {step === 1 && (
            <RoleSelection
            onNext={nextStep}
            updateData={updateData}
            />
        )}

        {step === 2 && (
            <UserDetailsForm
            onNext={nextStep}
            onBack={prevStep}
            updateData={updateData}
            values={formData}
            />
        )}

        {step === 3 && (
            <BirthDateForm
            onBack={prevStep}
            updateData={updateData}
            values={formData}
            />
        )}
        </>
    );
}
