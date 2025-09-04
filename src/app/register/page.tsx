'use client';

import { useState } from 'react';
import RoleSelection from '@/app/register/RoleSelection';
import UserDetailsForm from '@/app/register/UserDetailsForm';
import BirthDateForm from '@/app/register/BirthDateForm';

export type RegisterFormData = {
  role: 'student' | 'teacher' | '';
  name: string;
  email: string;
  password: string;
  birthDate: string; // YYYY-MM-DD
};

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    role: '',
    name: '',
    email: '',
    password: '',
    birthDate: '',
  });

  const nextStep = () => setStep((s) => (s < 3 ? (s + 1) as typeof step : s));
  const prevStep = () => setStep((s) => (s > 1 ? (s - 1) as typeof step : s));
  const updateData = (patch: Partial<RegisterFormData>) =>
    setFormData((d) => ({ ...d, ...patch }));

  return (
    <>
      {step === 1 && (
        <RoleSelection onNext={nextStep} updateData={updateData} currentRole={formData.role} />
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
