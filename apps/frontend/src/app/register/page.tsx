'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName }),
      });
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-brand-600 py-2 text-white">
          Register
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="text-brand-600">Already have an account?</Link>
        </p>
      </form>
    </div>
  );
}
