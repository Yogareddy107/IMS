import { NextResponse } from 'next/server';
import {
  getAllProvisionedAccounts,
  deleteProvisionedAccount,
} from '@/lib/auth/provisioned-store';

export async function GET() {
  try {
    const accounts = await getAllProvisionedAccounts();
    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('API get accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve provisioned accounts.' },
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

    await deleteProvisionedAccount(identifier);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API delete account error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete provisioned account.' },
      { status: 500 }
    );
  }
}
