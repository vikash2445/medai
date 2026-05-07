'use client';

import { useUser, useSession } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

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
        
        // Create a temporary Supabase client with the token
        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        const email = user.emailAddresses[0]?.emailAddress || '';
        const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || email.split('@')[0];
        const phone = user.phoneNumbers?.[0]?.phoneNumber || null;

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabaseWithToken
          .from('profiles')
          .select('clerk_id')
          .eq('clerk_id', user.id)
          .maybeSingle();

        const profileData = {
          clerk_id: user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        };

        if (!existingProfile) {
          // Create new profile
          const { error: insertError } = await supabaseWithToken
            .from('profiles')
            .insert(profileData);

          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            console.log('✅ User profile created in Supabase');
          }
        } else {
          // Update existing profile
          const { error: updateError } = await supabaseWithToken
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