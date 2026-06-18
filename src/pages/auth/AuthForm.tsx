interface AuthFormProps {
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
  setErrorMsg: (v: string | null) => void;
  setSubmitting: (v: boolean) => void;
  setResendMsg: (v: string | null) => void;
  lastResendEmail: string | null;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  email: string;
  password: string;
  submitting: boolean;
  authNotice: string | null;
  setAuthNotice: (v: string | null) => void;
}

export default function AuthForm(_props: AuthFormProps) {
  return null;
}
