-- Test if echo_threads INSERT works with auth context
CREATE OR REPLACE FUNCTION test_echo_insert()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  test_thread_id UUID;
  test_message_id UUID;
BEGIN
  -- Try to insert a thread
  INSERT INTO echo_threads (user_id) 
  VALUES (auth.uid()) 
  RETURNING id INTO test_thread_id;
  
  -- Try to insert a message
  INSERT INTO echo_messages (thread_id, user_id, role, content) 
  VALUES (test_thread_id, auth.uid(), 'user', 'Test message') 
  RETURNING id INTO test_message_id;
  
  -- Clean up test data
  DELETE FROM echo_messages WHERE id = test_message_id;
  DELETE FROM echo_threads WHERE id = test_thread_id;
  
  RETURN 'SUCCESS: Both inserts worked';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$;