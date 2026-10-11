'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { INITIAL_PROFILES } from '@/lib/sample-data';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export type ProvisionedAccount = UserProfile;

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  switchDemoUser: (userId: string) => void;
  availableProfiles: UserProfile[];
  provisionUser: (data: {
    full_name: string;
    email: string;
    role: UserRole;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; account?: UserProfile }>;
  deleteUser: (userId: string) => void;
  getProvisionedAccounts: () => ProvisionedAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'isl_ims_active_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session & fetch Supabase profiles on mount (NO LOCAL STORAGE)
  useEffect(() => {
    // 1. Session check in current tab (sessionStorage, not localStorage)
    if (typeof window !== 'undefined') {
      try {
        const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession) as UserProfile;
          if (parsed && parsed.email) {
            setCurrentUser(parsed);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }

    const supabaseActive = isSupabaseConfigured();
    setIsDemo(!supabaseActive);

    // 2. Fetch profiles directly from Supabase backend
    const loadSupabaseProfiles = async () => {
      if (supabaseActive && supabase) {
        try {
          const { data, error } = await supabase.from('profiles').select('*');
          if (data && !error && data.length > 0) {
            const mappedProfiles: UserProfile[] = data.map((p) => ({
              id: p.id,
              email: p.email,
              full_name: p.full_name,
              role: (p.role as UserRole) || 'intern',
              phone: p.phone || '',
              avatar_url: p.avatar_url || null,
              status: p.status || 'active',
              created_at: p.created_at || new Date().toISOString(),
            }));

            setAvailableProfiles(mappedProfiles);
          }
        } catch (err) {
          console.warn('Supabase profiles fetch note:', err);
        }
      }

      // Also sync from /api/auth/accounts as server verification
      try {
        const res = await fetch('/api/auth/accounts');
        const json = await res.json();
        if (json?.success && Array.isArray(json.accounts)) {
          const apiProfiles: UserProfile[] = json.accounts.map((acc: UserProfile) => ({
            id: acc.id,
            email: acc.email,
            full_name: acc.full_name,
            role: acc.role,
            phone: acc.phone || '',
            avatar_url: acc.avatar_url || null,
            status: acc.status || 'active',
            created_at: acc.created_at || new Date().toISOString(),
          }));

          setAvailableProfiles((prev) => {
            const map = new Map<string, UserProfile>();
            prev.forEach((p) => map.set(p.email.toLowerCase(), p));
            apiProfiles.forEach((p) => map.set(p.email.toLowerCase(), p));
            return Array.from(map.values());
          });
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseProfiles();

    // Realtime WebSockets: Listen for user provisioning changes
    const client = supabase;
    if (client) {
      const channel = client
        .channel('ims-profiles-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const p = payload.new as {
                id: string;
                email: string;
                full_name: string;
                role?: string;
                phone?: string;
                avatar_url?: string | null;
                status?: string;
                created_at?: string;
              };
              if (p && p.email) {
                const mapped: UserProfile = {
                  id: p.id,
                  email: p.email,
                  full_name: p.full_name,
                  role: (p.role as UserRole) || 'intern',
                  phone: p.phone || '',
                  avatar_url: p.avatar_url || null,
                  status: (p.status as any) || 'active',
                  created_at: p.created_at || new Date().toISOString(),
                };
                setAvailableProfiles((prev) => [
                  mapped,
                  ...prev.filter((item) => item.email.toLowerCase() !== mapped.email.toLowerCase()),
                ]);
              }
            } else if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id: string })?.id;
              if (oldId) {
                setAvailableProfiles((prev) => prev.filter((item) => item.id !== oldId));
              }
            }
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, []);

  /**
   * Passwordless Login: Verify email directly against Supabase & Admin Master
   */
  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // 1. Direct Admin Access Verification
    if (cleanEmail === 'teamintrasphere@gmail.com') {
      const adminProfile: UserProfile = {
        id: '1aba0833-091a-4d00-979b-976507530e0c',
        email: 'teamintrasphere@gmail.com',
        full_name: 'IntraSphere Admin',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setCurrentUser(adminProfile);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
      }
      return { success: true };
    }

    // 2. Direct Supabase 'profiles' Query
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          const profile: UserProfile = {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            role: (data.role as UserRole) || 'intern',
            status: data.status || 'active',
            phone: data.phone || '',
            avatar_url: data.avatar_url || null,
            created_at: data.created_at || new Date().toISOString(),
          };
          setCurrentUser(profile);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
          }
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase profile query note:', err);
      }

      // Also check 'interns' table in Supabase
      try {
        const { data: internData, error: internErr } = await supabase
          .from('interns')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (internData && !internErr) {
          const profile: UserProfile = {
            id: internData.user_id || internData.id,
            email: internData.email,
            full_name: internData.full_name,
            role: 'intern',
            status: 'active',
            phone: internData.phone || '',
            created_at: internData.created_at || new Date().toISOString(),
          };
          setCurrentUser(profile);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
          }
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase intern query note:', err);
      }
    }

    // 3. Server-side API verification (/api/auth/login)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const json = await res.json();
      if (json.success && json.user) {
        setCurrentUser(json.user);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(json.user));
        }
        return { success: true };
      }
    } catch (err) {
      console.warn('API login check note:', err);
    }

    // 4. In-memory / Pre-seeded accounts fallback
    const matched = availableProfiles.find(
      (p) => p.email.toLowerCase() === cleanEmail
    );
    if (matched) {
      setCurrentUser(matched);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(matched));
      }
      return { success: true };
    }

    return {
      success: false,
      error: `Access Denied: '${cleanEmail}' is not recognized. Please ask the Administrator to provision your account.`,
    };
  };

  /**
   * Provision User: Passwordless, direct Supabase persistence
   */
  const provisionUser = async ({
    full_name,
    email,
    role,
    phone,
  }: {
    full_name: string;
    email: string;
    role: UserRole;
    phone?: string;
  }): Promise<{ success: boolean; error?: string; account?: UserProfile }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();

    if (!cleanEmail || !cleanName) {
      return { success: false, error: 'Full name and email are required.' };
    }

    const newId = `usr-${Date.now()}`;
    const now = new Date().toISOString();

    const newProfile: UserProfile = {
      id: newId,
      email: cleanEmail,
      full_name: cleanName,
      role,
      status: 'active',
      phone: phone?.trim() || '',
      created_at: now,
    };

    // 1. Direct Supabase Insert/Upsert
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: newId,
          email: cleanEmail,
          full_name: cleanName,
          role,
          phone: phone?.trim() || '',
          status: 'active',
          updated_at: now,
        });
      } catch (err) {
        console.warn('Supabase profile direct upsert note:', err);
      }
    }

    // 2. Server API Sync
    try {
      await fetch('/api/auth/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          email: cleanEmail,
          role,
          phone: phone?.trim() || '',
        }),
      });
    } catch (err) {
      console.warn('Server provision API note:', err);
    }

    // 3. Update active state
    setAvailableProfiles((prev) => [
      newProfile,
      ...prev.filter((p) => p.email.toLowerCase() !== cleanEmail),
    ]);

    return {
      success: true,
      account: newProfile,
    };
  };

  /**
   * Delete User: Removes from Supabase backend
   */
  const deleteUser = async (userId: string) => {
    const target = availableProfiles.find((p) => p.id === userId);
    setAvailableProfiles((prev) => prev.filter((p) => p.id !== userId));

    if (supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
        if (target?.email) {
          await supabase.from('profiles').delete().ilike('email', target.email);
        }
      } catch (err) {
        console.warn('Supabase delete profile note:', err);
      }
    }

    try {
      const param = target?.email
        ? `email=${encodeURIComponent(target.email)}`
        : `id=${encodeURIComponent(userId)}`;
      fetch(`/api/auth/accounts?${param}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const getProvisionedAccounts = (): ProvisionedAccount[] => {
    return availableProfiles;
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setCurrentUser(null);
  };

  const switchDemoRole = (role: UserRole) => {
    const matchedProfile = availableProfiles.find((p) => p.role === role);
    if (matchedProfile) {
      setCurrentUser(matchedProfile);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(matchedProfile));
      }
    } else {
      const syntheticProfile: UserProfile = {
        id: `demo-${role}-${Date.now()}`,
        email: `${role}@intraspherelabs.com`,
        full_name: `IntraSphere ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setCurrentUser(syntheticProfile);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(syntheticProfile));
      }
    }
  };

  const switchDemoUser = (userId: string) => {
    const profile = availableProfiles.find((p) => p.id === userId);
    if (profile) {
      setCurrentUser(profile);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || 'intern',
        isDemoMode: isDemo,
        isLoading,
        login,
        logout,
        switchDemoRole,
        switchDemoUser,
        availableProfiles,
        provisionUser,
        deleteUser,
        getProvisionedAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
