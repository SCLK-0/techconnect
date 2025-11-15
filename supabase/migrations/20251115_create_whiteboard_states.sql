-- Create whiteboard_states table for persisting whiteboard content
CREATE TABLE IF NOT EXISTS public.whiteboard_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  canvas_state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_whiteboard_states_session_id ON public.whiteboard_states(session_id);

-- Enable RLS
ALTER TABLE public.whiteboard_states ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view whiteboard state for sessions they're part of
CREATE POLICY "Users can view whiteboard for their sessions"
  ON public.whiteboard_states
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = whiteboard_states.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Policy: Users can insert/update whiteboard state for sessions they're part of
CREATE POLICY "Users can modify whiteboard for their sessions"
  ON public.whiteboard_states
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = whiteboard_states.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = whiteboard_states.session_id
      AND (sessions.tutor_id = auth.uid() OR sessions.learner_id = auth.uid())
    )
  );

-- Policy: Admins can view all whiteboard states
CREATE POLICY "Admins can view all whiteboards"
  ON public.whiteboard_states
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment
COMMENT ON TABLE public.whiteboard_states IS 'Stores whiteboard canvas state for each session to persist drawings across reconnections';
