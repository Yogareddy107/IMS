import fs from 'fs';
import path from 'path';
import { UserProfile, UserRole } from '@/types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ProvisionedAccountRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  password: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

// In-memory cache seeded with pre-authorized accounts
const INITIAL_SEED_ACCOUNTS: ProvisionedAccountRecord[] = [
  {
    id: 'usr-yoga-coord',
    email: 'yogareddy107@gmail.com',
    full_name: 'Yoga Reddy',
    role: 'coordinator',
    password: 'ISL@50',
    phone: '',
    status: 'active',
    created_at: '2026-10-11T09:00:00.000Z',
  },
];

let memoryAccounts: ProvisionedAccountRecord[] = [...INITIAL_SEED_ACCOUNTS];

function getStorageFilePath(): string {
  // Best-effort path resolution for Node environments
  try {
    const projectPath = path.join(process.cwd(), 'src', 'data', 'provisioned-accounts.json');
    if (fs.existsSync(path.dirname(projectPath))) {
      return projectPath;
    }
  } catch {
    // fallback
  }
  return path.join('/tmp', 'isl_provisioned_accounts.json');
}

function loadAccountsFromFile(): ProvisionedAccountRecord[] {
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content) as ProvisionedAccountRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ProvisionedStore] Note reading accounts file:', err);
  }
  return INITIAL_SEED_ACCOUNTS;
}

function saveAccountsToFile(accounts: ProvisionedAccountRecord[]) {
  try {
    const filePath = getStorageFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ProvisionedStore] Note saving accounts file:', err);
  }
}

function getSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (supabaseUrl && serviceKey && supabaseUrl.startsWith('https://')) {
    return createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return null;
}

/**
 * Fetch all provisioned accounts from memory, file, and Supabase table
 */
export async function getAllProvisionedAccounts(): Promise<ProvisionedAccountRecord[]> {
  const fileAccounts = loadAccountsFromFile();
  const accountMap = new Map<string, ProvisionedAccountRecord>();

  // 1. Seed & Memory
  memoryAccounts.forEach((acc) => accountMap.set(acc.email.toLowerCase(), acc));
  // 2. File
  fileAccounts.forEach((acc) => accountMap.set(acc.email.toLowerCase(), acc));

  // 3. Supabase table 'provisioned_accounts' (if instantiated)
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('provisioned_accounts')
        .select('*');

      if (data && !error && Array.isArray(data)) {
        data.forEach((row) => {
          if (row.email && row.password) {
            accountMap.set(row.email.toLowerCase(), {
              id: row.id || `usr-${Date.now()}`,
              email: row.email.toLowerCase(),
              full_name: row.full_name || 'IMS User',
              role: (row.role as UserRole) || 'intern',
              password: row.password,
              phone: row.phone || '',
              status: row.status || 'active',
              created_at: row.created_at || new Date().toISOString(),
            });
          }
        });
      }
    } catch {
      // Table may not exist yet if migration not run
    }
  }

  const combined = Array.from(accountMap.values());
  memoryAccounts = combined;
  return combined;
}

/**
 * Save / Upsert a provisioned account
 */
export async function saveProvisionedAccount(
  account: ProvisionedAccountRecord
): Promise<ProvisionedAccountRecord> {
  const cleanEmail = account.email.trim().toLowerCase();
  const normalizedAccount: ProvisionedAccountRecord = {
    ...account,
    email: cleanEmail,
    full_name: account.full_name.trim(),
    role: account.role,
    password: account.password.trim(),
    created_at: account.created_at || new Date().toISOString(),
  };

  // 1. Update in-memory
  const current = await getAllProvisionedAccounts();
  const filtered = current.filter((a) => a.email.toLowerCase() !== cleanEmail);
  const updated = [normalizedAccount, ...filtered];
  memoryAccounts = updated;

  // 2. Persist to file
  saveAccountsToFile(updated);

  // 3. Sync to Supabase
  const supabase = getSupabaseServerClient();
  if (supabase) {
    // A. Sync to provisioned_accounts table
    try {
      await supabase.from('provisioned_accounts').upsert({
        id: normalizedAccount.id,
        email: cleanEmail,
        full_name: normalizedAccount.full_name,
        role: normalizedAccount.role,
        password: normalizedAccount.password,
        phone: normalizedAccount.phone || '',
        status: normalizedAccount.status,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[ProvisionedStore] Supabase table sync note:', err);
    }

    // B. If SUPABASE_SERVICE_ROLE_KEY is set, create in Supabase Auth directly with email_confirm: true
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.auth.admin.createUser({
          email: cleanEmail,
          password: normalizedAccount.password,
          email_confirm: true,
          user_metadata: {
            full_name: normalizedAccount.full_name,
            role: normalizedAccount.role,
          },
        });
      } catch (authErr) {
        console.warn('[ProvisionedStore] Supabase admin user create note:', authErr);
      }
    }
  }

  return normalizedAccount;
}

/**
 * Remove a provisioned account
 */
export async function deleteProvisionedAccount(emailOrId: string): Promise<boolean> {
  const clean = emailOrId.trim().toLowerCase();
  const current = await getAllProvisionedAccounts();
  const updated = current.filter(
    (a) => a.email.toLowerCase() !== clean && a.id !== clean
  );
  memoryAccounts = updated;
  saveAccountsToFile(updated);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('provisioned_accounts')
        .delete()
        .or(`email.eq.${clean},id.eq.${clean}`);
    } catch {
      // ignore
    }
  }

  return true;
}

/**
 * Verify user credentials against:
 * 1. Admin Master Passwords
 * 2. Pre-authorized & Dynamic Provisioned Accounts
 */
export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<{ user: UserProfile; error?: string } | { user: null; error: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { user: null, error: 'Email and password are required.' };
  }

  // 1. Direct Admin Master Credentials
  if (
    cleanEmail === 'teamintrasphere@gmail.com' &&
    (cleanPassword === 'Yogareddy@1819' || cleanPassword === 'admin')
  ) {
    const adminProfile: UserProfile = {
      id: '1aba0833-091a-4d00-979b-976507530e0c',
      email: 'teamintrasphere@gmail.com',
      full_name: 'IntraSphere Admin',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    return { user: adminProfile };
  }

  // 2. Check Provisioned Accounts
  const allAccounts = await getAllProvisionedAccounts();
  const matched = allAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (matched) {
    // Allow matching the stored password or master fallback passwords
    const isPasswordValid =
      matched.password === cleanPassword ||
      cleanPassword === 'Yogareddy@1819' ||
      cleanPassword === 'Welcome@2025' ||
      cleanPassword === 'Demo@123';

    if (!isPasswordValid) {
      return {
        user: null,
        error: 'Incorrect password. Please verify the credentials provided by your Administrator.',
      };
    }

    const profile: UserProfile = {
      id: matched.id,
      email: matched.email,
      full_name: matched.full_name,
      role: matched.role,
      status: matched.status,
      phone: matched.phone,
      created_at: matched.created_at,
    };
    return { user: profile };
  }

  return {
    user: null,
    error: 'Invalid email address or password. Authorized accounts must be provisioned by the Administrator.',
  };
}
