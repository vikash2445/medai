'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { createBrowserClient } from '@lib/supabase-admin';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: 'admin' | 'customer' | 'staff';
}

export function useAuth() {
  const { userId, isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const supabase = createBrowserClient();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    if (!userId || !isSignedIn) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setUser(data as UserProfile);
      
      // Check if user is admin
      const adminIds = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS ?? '').split(',');
      setIsAdmin(adminIds.includes(userId));
    }
    
    setLoading(false);
  }, [userId, isSignedIn, supabase]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    setUser(data as UserProfile);
    return data;
  }, [userId, supabase]);

  const hasPermission = useCallback((requiredRole: 'admin' | 'staff' | 'customer') => {
    if (requiredRole === 'admin') return isAdmin;
    if (requiredRole === 'staff') return isAdmin || user?.role === 'staff';
    return isSignedIn; // customer just needs to be logged in
  }, [isAdmin, isSignedIn, user]);

  useEffect(() => {
    if (clerkLoaded) {
      fetchUserProfile();
    }
  }, [clerkLoaded, fetchUserProfile]);

  return {
    user,
    loading,
    isSignedIn,
    isAdmin,
    hasPermission,
    updateProfile,
    refresh: fetchUserProfile,
  };
}