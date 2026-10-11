import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '@/types';
import { INITIAL_PROFILES } from '@/lib/sample-data';

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

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    let accounts: UserProfile[] = [...INITIAL_PROFILES];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (data && !error && Array.isArray(data) && data.length > 0) {
          accounts = data.map((row) => ({
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            role: (row.role as UserRole) || 'intern',
            phone: row.phone || '',
            avatar_url: row.avatar_url || null,
            status: row.status || 'active',
            created_at: row.created_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Database accounts fetch note:', err);
      }
    }

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('API get accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve accounts.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('id') || searchParams.get('email');

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'User id or email is required.' },
        { status: 400 }
      );
    }

    const clean = identifier.trim().toLowerCase();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .delete()
          .or(`email.ilike.${clean},id.eq.${clean}`);
      } catch (err) {
        console.warn('Database delete account note:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API delete account error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account.' },
      { status: 500 }
    );
  }
}
