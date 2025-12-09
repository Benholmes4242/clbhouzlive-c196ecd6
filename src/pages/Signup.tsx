import React from "react";
import Auth from "./Auth";

// Signup page - renders Auth in signup mode
const Signup: React.FC = () => {
  return <Auth defaultSignUp={true} />;
};

export default Signup;
