-- Create session_participants table for tag-along sessions
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('observer', 'participant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique combination of session_id, user_id, and role
  UNIQUE(session_id, user_id, role)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_status ON session_participants(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_role ON session_participants(role);

-- Enable RLS
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view participants for sessions they're involved in (as tutor, learner, or observer)
CREATE POLICY "Users can view session participants for their sessions" ON session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions s 
      WHERE s.id = session_participants.session_id 
      AND (s.tutor_id = auth.uid() OR s.learner_id = auth.uid())
    )
    OR user_id = auth.uid()
  );

-- Users can insert observer requests for themselves
CREATE POLICY "Users can request to observe sessions" ON session_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND role = 'observer'
    AND status = 'pending'
  );

-- Session owners (learners) can update observer requests for their sessions
CREATE POLICY "Session owners can approve/reject observer requests" ON session_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions s 
      WHERE s.id = session_participants.session_id 
      AND s.learner_id = auth.uid()
    )
    AND role = 'observer'
  );

-- Add allow_observers column to sessions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'allow_observers') THEN
    ALTER TABLE sessions ADD COLUMN allow_observers BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index on allow_observers for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_allow_observers ON sessions(allow_observers) WHERE allow_observers = true;

-- Create a function to request observer access (RPC function)
CREATE OR REPLACE FUNCTION request_observer_access(
  p_session_id UUID,
  p_requester_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  existing_request RECORD;
BEGIN
  -- Check if session exists and allows observers
  SELECT * INTO session_record 
  FROM sessions 
  WHERE id = p_session_id AND allow_observers = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session not found or does not allow observers'
    );
  END IF;
  
  -- Check if user is not the tutor or learner of this session
  IF session_record.tutor_id = p_requester_id OR session_record.learner_id = p_requester_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot observe your own session'
    );
  END IF;
  
  -- Check if request already exists
  SELECT * INTO existing_request
  FROM session_participants
  WHERE session_id = p_session_id 
    AND user_id = p_requester_id 
    AND role = 'observer';
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Observer request already exists for this session'
    );
  END IF;
  
  -- Insert the observer request
  INSERT INTO session_participants (session_id, user_id, role, status, message)
  VALUES (p_session_id, p_requester_id, 'observer', 'pending', p_message);
  
  -- Send notification to session owner (learner)
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    session_record.learner_id,
    'session',
    'New Tag-Along Request',
    'Someone wants to tag along to your session: ' || session_record.subject,
    '/learner/sessions'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Observer request sent successfully!'
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION request_observer_access TO authenticated;