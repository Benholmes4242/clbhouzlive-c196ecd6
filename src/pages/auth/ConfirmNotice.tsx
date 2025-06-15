
import React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ConfirmNoticeProps {
  lastResendEmail: React.MutableRefObject<string>;
  password: string;
  setResending: (b: boolean) => void;
  resending: boolean;
  setResendMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
}

const ConfirmNotice: React.FC<ConfirmNoticeProps> = ({
  lastResendEmail,
  password,
  setResending,
  resending,
  setResendMsg,
  setErrorMsg,
}) => {
  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    setErrorMsg(null);

    if (!lastResendEmail.current) {
      setErrorMsg("Please enter your email.");
      setResending(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: lastResendEmail.current,
        password: password || "tempor4ryDummy#123",
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error && !error.message.includes("User already registered")) {
        setErrorMsg(error.message);
      } else {
        setResendMsg("Confirmation email resent! Please check your inbox.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend confirmation email.");
    }
    setResending(false);
  };

  return (
    <Button
      variant="secondary"
      className="w-full mt-3"
      disabled={resending}
      onClick={handleResend}
    >
      {resending ? "Resending..." : "Resend Confirmation Email"}
    </Button>
  );
};

export default ConfirmNotice;
