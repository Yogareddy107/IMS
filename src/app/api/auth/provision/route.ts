import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '@/types';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key && url.startsWith('https://')) {
    return createClient(url, key, { auth: { persistSession: false } });
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, role, phone } = body || {};

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(full_name).trim();
    const cleanRole: UserRole =
      role === 'admin' || role === 'coordinator' || role === 'intern'
        ? role
        : 'intern';

    const newId = `usr-${Date.now()}`;
    const now = new Date().toISOString();

    const newProfile: UserProfile = {
      id: newId,
      email: cleanEmail,
      full_name: cleanName,
      role: cleanRole,
      phone: phone ? String(phone).trim() : '',
      status: 'active',
      created_at: now,
    };

    // Upsert directly into Supabase profiles table
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: newId,
          email: cleanEmail,
          full_name: cleanName,
          role: cleanRole,
          phone: phone ? String(phone).trim() : '',
          status: 'active',
          updated_at: now,
        });
      } catch (dbErr) {
        console.warn('Database upsert note in /api/auth/provision:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      account: newProfile,
    });
  } catch (error) {
    console.error('API provision error:', error);
    return NextResponse.json(
      { success: false, error: 'Provisioning service encountered an error.' },
      { status: 500 }
    );
  }
}
