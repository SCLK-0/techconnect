import { supabase } from "@/integrations/supabase/client";

export async function seedAdminData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("No authenticated user, skipping seed");
      return;
    }

    // Check if there are already logs (not just sessions)
    const { data: existingLogs, error: logsCheckError } = await supabase
      .from("session_logs")
      .select("id")
      .limit(1);

    if (logsCheckError) {
      console.error("Error checking existing logs:", logsCheckError);
    }

    if (existingLogs && existingLogs.length > 0) {
      console.log("Session logs already exist, skipping seed");
      return;
    }

    // Get current user's profile and other profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(5);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found to seed data");
      return;
    }

    // Use current user as LEARNER (so they can insert via RLS) and find another user as tutor
    const learnerId = user.id; // Current user is learner
    const tutorId = profiles.find(p => p.user_id !== user.id)?.user_id || user.id; // Another user or self as tutor

    console.log("Creating sample sessions with tutor:", tutorId, "learner:", learnerId);

    // Create sample sessions with learner as current user (RLS allows learners to insert)
    const now = new Date();
    const sessions = [
      {
        tutor_id: tutorId,
        learner_id: learnerId, // Current user as learner
        subject: "Programming Fundamentals",
        duration_minutes: 60,
        scheduled_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        session_status: "completed",
        session_type: "scheduled"
      },
      {
        tutor_id: tutorId,
        learner_id: learnerId, // Current user as learner
        subject: "Automotive Basics",
        duration_minutes: 90,
        scheduled_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        session_status: "completed",
        session_type: "instant"
      },
      {
        tutor_id: tutorId,
        learner_id: learnerId, // Current user as learner
        subject: "Web Development",
        duration_minutes: 120,
        scheduled_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
        session_status: "completed",
        session_type: "scheduled"
      }
    ];

    const { data: createdSessions, error: sessionsError } = await supabase
      .from("sessions")
      .insert(sessions)
      .select();

    if (sessionsError) {
      console.error("Error creating sessions:", sessionsError);
      return;
    }

    if (!createdSessions || createdSessions.length === 0) {
      console.log("No sessions were created");
      return;
    }

    console.log("Created", createdSessions.length, "sessions");

    // Create session logs for each session (use learner as creator so RLS allows it)
    const sessionLogs = createdSessions.map((session, idx) => ({
      session_id: session.id,
      user_id: session.learner_id, // Learner creates the log (part of session)
      user_role: "learner",
      topics_covered: `Session ${idx + 1}: Introduction to core concepts, practical examples, and Q&A session. Covered fundamental theory and real-world applications. Discussed best practices and common pitfalls.`,
      accomplishments: "Demonstrated strong understanding of key principles and completed all practice exercises successfully. Great progress shown throughout the session.",
      homework: "Review chapter materials, complete 5-10 practice problems, prepare questions for next session, and work on the assigned project.",
      next_steps: "Continue with advanced topics in the next session. Focus on problem-solving techniques and real-world applications. Schedule follow-up session."
    }));

    const { data: createdLogs, error: logsError } = await supabase
      .from("session_logs")
      .insert(sessionLogs)
      .select();

    if (logsError) {
      console.error("Error creating session logs:", logsError);
      return;
    }

    console.log("Successfully seeded", createdLogs?.length || 0, "session logs");
  } catch (error) {
    console.error("Error in seedAdminData:", error);
  }
}
