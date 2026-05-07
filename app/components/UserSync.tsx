'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const syncUserToSupabase = async () => {
      if (!isSignedIn || !user || synced) return;

      try {
        const email = user.emailAddresses[0]?.emailAddress || '';
        const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0];
        const phone = user.phoneNumbers?.[0]?.phoneNumber || null;

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        const profileData = {
          clerk_id: user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        };

        if (!existingProfile) {
          // Create new profile
          const { error } = await supabase
            .from('profiles')
            .insert(profileData);

          if (error) throw error;
          console.log('✅ User profile created in Supabase');
        } else {
          // Update existing profile
          const { error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('clerk_id', user.id);

          if (error) throw error;
          console.log('✅ User profile updated in Supabase');
        }

        setSynced(true);
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    };

    syncUserToSupabase();
  }, [isSignedIn, user, synced]);

  // This component doesn't render anything visible
  return null;
}