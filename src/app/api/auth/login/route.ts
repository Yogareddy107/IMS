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
    const { email } = body || {};

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Direct Admin Master Email
    if (cleanEmail === 'teamintrasphere@gmail.com') {
      const adminProfile: UserProfile = {
        id: '1aba0833-091a-4d00-979b-976507530e0c',
        email: 'teamintrasphere@gmail.com',
        full_name: 'IntraSphere Admin',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, user: adminProfile });
    }

    // 2. Query Supabase profiles table
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (profileData && !profileErr) {
          const user: UserProfile = {
            id: profileData.id,
            email: profileData.email,
            full_name: profileData.full_name,
            role: (profileData.role as UserRole) || 'intern',
            status: profileData.status || 'active',
            phone: profileData.phone || '',
            avatar_url: profileData.avatar_url || null,
            created_at: profileData.created_at || new Date().toISOString(),
          };
          return NextResponse.json({ success: true, user });
        }

        // Also check interns table
        const { data: internData, error: internErr } = await supabase
          .from('interns')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (internData && !internErr) {
          const user: UserProfile = {
            id: internData.user_id || internData.id,
            email: internData.email,
            full_name: internData.full_name,
            role: 'intern',
            status: 'active',
            phone: internData.phone || '',
            created_at: internData.created_at || new Date().toISOString(),
          };
          return NextResponse.json({ success: true, user });
        }
      } catch (dbErr) {
        console.warn('Database query note in /api/auth/login:', dbErr);
      }
    }

    // 3. Fallback Seed Accounts
    if (cleanEmail === 'yogareddy107@gmail.com') {
      const coordinatorProfile: UserProfile = {
        id: 'usr-yoga-coord',
        email: 'yogareddy107@gmail.com',
        full_name: 'Yoga Reddy',
        role: 'coordinator',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, user: coordinatorProfile });
    }

    return NextResponse.json(
      {
        success: false,
        error: `Access Denied: '${cleanEmail}' is not provisioned. Only authorized accounts provisioned by the Administrator can access IMS.`,
      },
      { status: 401 }
    );
  } catch (error) {
    console.error('API login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
