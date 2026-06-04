'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand-700">
          TravelBook
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/search?availableOnly=true" className="hover:text-brand-600">
            Holidays
          </Link>
          {loggedIn ? (
            <>
              <Link href="/bookings" className="hover:text-brand-600">
                My Bookings
              </Link>
              <Link href="/admin" className="hover:text-brand-600">
                Admin
              </Link>
              <button onClick={logout} className="text-slate-600 hover:text-brand-600">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
