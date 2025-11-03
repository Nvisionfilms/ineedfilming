import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";

interface MFAChallengeProps {
  factorId: string;
  onSuccess: () => void;
}

export const MFAChallenge = ({ factorId, onSuccess }: MFAChallengeProps) => {
  const [code, setCode] = useState(() => {
    // Restore partially entered code from sessionStorage (mobile app switch scenario)
    return sessionStorage.getItem('mfa_code_input') || "";
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  // Persist code input to sessionStorage as user types
  const handleCodeChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(cleanedValue);
    if (cleanedValue) {
      sessionStorage.setItem('mfa_code_input', cleanedValue);
    } else {
      sessionStorage.removeItem('mfa_code_input');
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) throw error;

      // Clear persisted code after successful verification
      sessionStorage.removeItem('mfa_code_input');

      toast({
        title: "Verified!",
        description: "Successfully authenticated",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Authentication Code</Label>
          <Input
            id="mfa-code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
        </div>

        <Button onClick={verifyCode} disabled={isVerifying} className="w-full">
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
