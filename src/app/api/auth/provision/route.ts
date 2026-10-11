import { NextResponse } from 'next/server';
import {
  saveProvisionedAccount,
  ProvisionedAccountRecord,
} from '@/lib/auth/provisioned-store';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, role, password, phone } = body || {};

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

    const finalPassword =
      password && String(password).trim()
        ? String(password).trim()
        : `ISL@${Math.floor(1000 + Math.random() * 9000)}`;

    const newRecord: ProvisionedAccountRecord = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: cleanName,
      role: cleanRole,
      password: finalPassword,
      phone: phone ? String(phone).trim() : '',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    const saved = await saveProvisionedAccount(newRecord);

    const { password: _, ...publicProfile } = saved;

    return NextResponse.json({
      success: true,
      tempPassword: finalPassword,
      account: publicProfile,
    });
  } catch (error) {
    console.error('API provision error:', error);
    return NextResponse.json(
      { success: false, error: 'Provisioning service encountered an error.' },
      { status: 500 }
    );
  }
}
