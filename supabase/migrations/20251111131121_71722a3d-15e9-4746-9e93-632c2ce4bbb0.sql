-- Enable realtime for tutor_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE tutor_profiles;

-- Set replica identity to full to get complete row data on updates
ALTER TABLE tutor_profiles REPLICA IDENTITY FULL;