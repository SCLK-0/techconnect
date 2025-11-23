import { supabase } from "@/integrations/supabase/client";

interface NotificationEmailPayload {
  to: string;
  type: "session_request" | "session_accepted" | "session_rejected" | "session_reminder" | "session_started" | "session_ended" | "instant_session_starting" | "session_missed" | "tutor_cancelled" | "scheduled_session_accepted";
  data: {
    recipientName?: string;
    senderName?: string;
    subject?: string;
    sessionTime?: string;
    sessionId?: string;
    reason?: string;
  };
}

export async function sendNotificationEmail(payload: NotificationEmailPayload) {
  try {
    console.log("Invoking send-notification-email function with payload:", payload);
    
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: payload,
    });

    if (error) {
      console.error("Error sending notification email:", error);
      return { success: false, error };
    }

    console.log("Notification email sent successfully:", data);
    
    // Check if the response indicates an error
    if (data?.error) {
      console.error("Email function returned error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error invoking notification email function:", error);
    return { success: false, error };
  }
}

// Helper functions for specific notification types
// Helper to safely get profile data
async function getProfileData(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Exception fetching profile for user ${userId}:`, error);
    return null;
  }
}

export async function sendSessionRequestEmail(
  tutorEmail: string,
  tutorName: string,
  learnerName: string,
  subject: string,
  sessionTime?: string
) {
  return sendNotificationEmail({
    to: tutorEmail,
    type: "session_request",
    data: {
      recipientName: tutorName,
      senderName: learnerName,
      subject,
      sessionTime,
    },
  });
}

export async function sendSessionAcceptedEmail(
  learnerEmail: string,
  learnerName: string,
  tutorName: string,
  subject: string,
  sessionTime?: string
) {
  return sendNotificationEmail({
    to: learnerEmail,
    type: "session_accepted",
    data: {
      recipientName: learnerName,
      senderName: tutorName,
      subject,
      sessionTime,
    },
  });
}

export async function sendSessionRejectedEmail(
  learnerEmail: string,
  learnerName: string,
  tutorName: string,
  reason?: string
) {
  return sendNotificationEmail({
    to: learnerEmail,
    type: "session_rejected",
    data: {
      recipientName: learnerName,
      senderName: tutorName,
      reason,
    },
  });
}

export async function sendSessionReminderEmail(
  userEmail: string,
  userName: string,
  subject: string,
  sessionTime: string
) {
  return sendNotificationEmail({
    to: userEmail,
    type: "session_reminder",
    data: {
      recipientName: userName,
      subject,
      sessionTime,
    },
  });
}

export async function sendSessionCancelledEmail(
  userEmail: string,
  userName: string,
  cancellerName: string,
  subject: string,
  reason?: string
) {
  return sendNotificationEmail({
    to: userEmail,
    type: "session_cancelled",
    data: {
      recipientName: userName,
      senderName: cancellerName,
      subject,
      reason,
    },
  });
}

export async function sendInstantSessionStartingEmail(
  userEmail: string,
  userName: string,
  otherUserName: string,
  subject: string,
  sessionId: string
) {
  return sendNotificationEmail({
    to: userEmail,
    type: "instant_session_starting",
    data: {
      recipientName: userName,
      senderName: otherUserName,
      subject,
      sessionId,
    },
  });
}

export async function sendSessionMissedEmail(
  userEmail: string,
  userName: string,
  otherUserName: string,
  subject: string,
  sessionTime: string
) {
  return sendNotificationEmail({
    to: userEmail,
    type: "session_missed",
    data: {
      recipientName: userName,
      senderName: otherUserName,
      subject,
      sessionTime,
    },
  });
}

export async function sendTutorCancelledEmail(
  learnerEmail: string,
  learnerName: string,
  tutorName: string,
  subject: string,
  reason?: string
) {
  return sendNotificationEmail({
    to: learnerEmail,
    type: "tutor_cancelled",
    data: {
      recipientName: learnerName,
      senderName: tutorName,
      subject,
      reason,
    },
  });
}

export async function sendScheduledSessionAcceptedEmail(
  learnerEmail: string,
  learnerName: string,
  tutorName: string,
  subject: string,
  sessionTime: string
) {
  return sendNotificationEmail({
    to: learnerEmail,
    type: "scheduled_session_accepted",
    data: {
      recipientName: learnerName,
      senderName: tutorName,
      subject,
      sessionTime,
    },
  });
}
