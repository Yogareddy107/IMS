import { NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/auth/provisioned-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const verification = await verifyUserCredentials(String(email), String(password));

    if (!verification.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            verification.error ||
            'Invalid email address or password. Authorized accounts must be provisioned by the Administrator.',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: verification.user,
    });
  } catch (error) {
    console.error('API login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}
