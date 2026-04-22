// app/lib/onesignal.ts

interface OneSignalNotification {
  app_id: string;
  headings: { en: string };
  contents: { en: string };
  url?: string;
  included_segments?: string[];
  include_external_user_ids?: string[];
}

/**
 * Sends a push notification to all subscribed users using OneSignal REST API
 * @param {string} heading - The title of the notification
 * @param {string} content - The body of the notification
 * @param {string} url - The web URL to open when clicked
 * @returns {Promise<boolean>} - Returns true if successful
 */
export async function sendDailyHealthTip(
  heading: string,
  content: string,
  url: string = '/'
): Promise<boolean> {
  try {
    const notificationData: OneSignalNotification = {
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
      headings: { en: heading },
      contents: { en: content },
      url: url,
      included_segments: ['Subscribed Users'],
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(notificationData),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ OneSignal notification sent:', data.id);
      return true;
    } else {
      console.error('❌ OneSignal API error:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);
    return false;
  }
}