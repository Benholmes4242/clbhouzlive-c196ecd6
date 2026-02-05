-- echo_rate_limits: deny all direct user access (service role bypasses RLS)
CREATE POLICY "No direct user access to rate limits"
  ON echo_rate_limits
  FOR ALL
  USING (false);

-- echo_response_cache: deny all direct user access (service role bypasses RLS)  
CREATE POLICY "No direct user access to response cache"
  ON echo_response_cache
  FOR ALL
  USING (false);