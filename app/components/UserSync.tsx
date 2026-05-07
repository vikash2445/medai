'use client';

import { useUser, useSession } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create a function to get the Supabase client with auth token
const getSupabaseClient = async (clerkToken: string) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    }
  );
};

export default function UserSync() {
  const { user, isSignedIn } = useUser();
  const { session } = useSession();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const syncUserToSupabase = async () => {
      if (!isSignedIn || !user || !session || synced) return;

      try {
        // Get the Clerk session token
        const token = await session.getToken();
        
        // Create Supabase client with token
        const supabase = await getSupabaseClient(token);

        const email = user.emailAddresses[0]?.emailAddress || '';
        const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0];
        const phone = user.phoneNumbers?.[0]?.phoneNumber || null;

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Fetch error:', fetchError);
        }

        const profileData = {
          clerk_id: user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        };

        if (!existingProfile) {
          // Create new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData);

          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            console.log('✅ User profile created in Supabase');
          }
        } else {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('clerk_id', user.id);

          if (updateError) {
            console.error('Update error:', updateError);
          } else {
            console.log('✅ User profile updated in Supabase');
          }
        }

        setSynced(true);
      } catch (error) {
        console.error('Error syncing user to Supabase:', error);
      }
    };

    syncUserToSupabase();
  }, [isSignedIn, user, session, synced]);

  return null;
}