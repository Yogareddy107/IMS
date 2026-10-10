import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Support both direct webhook payloads and Supabase database webhook payloads
    const candidateData = payload.record || payload;
    const { full_name, email, phone, role_title, role, skills } = candidateData;

    if (!email || !full_name) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required to sync application' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(full_name).trim();
    const cleanRole = String(role_title || role || 'Product Research Intern').trim();
    const cleanPhone = phone ? String(phone).trim() : '';

    console.log('[Careers Sync Received]', {
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Candidate application for ${cleanName} (${cleanEmail}) queued and synced successfully.`,
      intern: {
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role_title: cleanRole,
        status: 'Selected',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
