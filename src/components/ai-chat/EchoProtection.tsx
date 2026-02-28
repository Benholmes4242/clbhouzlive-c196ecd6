import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";
import { PiWaveform } from 'react-icons/pi';
import { toast } from 'sonner';

interface EchoProtectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operation: string;
}

const ECHO_PASSWORD = "echochange2024";

const EchoProtection: React.FC<EchoProtectionProps> = ({
  isOpen,
  onClose,
  onSuccess,
  operation
}) => {
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ECHO_PASSWORD) {
      toast.success("Access Granted", { description: `Echo AI ${operation} authorized` });
      setPassword('');
      setAttempts(0);
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      
      toast.error("Access Denied", { description: `Incorrect password. Attempt ${newAttempts}/3` });

      if (newAttempts >= 3) {
        toast.error("Too Many Attempts", { description: "Echo AI protection engaged. Please contact administrator." });
        onClose();
      }
    }
  };

  const handleClose = () => {
    setPassword('');
    setAttempts(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiWaveform 
              size={20} 
              className="text-amber-500 transition-all duration-200 ease-in-out"
              style={{
                animation: 'echoWave 3s ease-in-out infinite'
              }}
            />
            Echo AI Protection
          </DialogTitle>
          <DialogDescription>
            This action requires authentication to prevent accidental changes to Echo AI functionality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Operation: {operation}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="echo-password" className="block text-body-sm font-medium mb-2">
                Enter Echo AI Password:
              </label>
              <Input
                id="echo-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password required for Echo AI changes"
                autoFocus
                required
              />
            </div>

            {attempts > 0 && (
              <div className="text-sm text-red-600">
                Attempts: {attempts}/3
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Authenticate
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EchoProtection;