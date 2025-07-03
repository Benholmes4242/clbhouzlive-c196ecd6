import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdateEmailRequest {
  userId: string;
  newEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the user is authenticated with the regular client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { userId, newEmail }: UpdateEmailRequest = await req.json();

    // Verify the user is trying to update their own email
    if (user.id !== userId) {
      throw new Error("Cannot update another user's email");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error("Invalid email format");
    }

    // Check if email is already in use
    const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error("Error checking existing users:", checkError);
      throw new Error("Failed to verify email availability");
    }

    const emailExists = existingUsers.users.some(
      (existingUser) => existingUser.email === newEmail && existingUser.id !== userId
    );

    if (emailExists) {
      throw new Error("Email address is already in use");
    }

    // Update the user's email using admin client (bypasses confirmation)
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true // This bypasses email confirmation
      }
    );

    if (updateError) {
      console.error("Error updating user email:", updateError);
      throw new Error(updateError.message || "Failed to update email");
    }

    console.log("Email updated successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email updated successfully",
        user: {
          id: updatedUser.user.id,
          email: updatedUser.user.email
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in update-user-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        success: false 
      }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 
               error.message.includes("already in use") ? 409 : 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);