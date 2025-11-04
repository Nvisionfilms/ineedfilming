import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const MFASetup = () => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [existingFactors, setExistingFactors] = useState<any[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingFactors();
  }, []);

  const checkExistingFactors = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setExistingFactors(data?.totp || []);
    } catch (error) {
      console.error("Error checking factors:", error);
    }
  };

  const removeUnverifiedFactors = async () => {
    setIsRemoving(true);
    try {
      const unverifiedFactors = existingFactors.filter(f => f.status === "unverified");
      
      for (const factor of unverifiedFactors) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }

      toast({
        title: "Cleared",
        description: "Unverified 2FA factors removed. You can now set up fresh.",
      });

      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      await checkExistingFactors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: error.message,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const removeAllFactors = async () => {
    if (!confirm("Are you sure? This will disable 2FA on your account. You'll need to set it up again.")) {
      return;
    }

    setIsRemoving(true);
    try {
      for (const factor of existingFactors) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }

      toast({
        title: "2FA Disabled",
        description: "All 2FA factors removed. You can now set up fresh from production.",
      });

      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      await checkExistingFactors();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: error.message,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const enrollMFA = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      
      toast({
        title: "Scan QR Code",
        description: "Use Google Authenticator to scan the QR code below",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: error.message,
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
      });
      return;
    }

    if (!factorId) {
      toast({
        variant: "destructive",
        title: "Setup Error",
        description: "Factor ID not found. Please try enrolling again.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // First create a challenge
      const challengeResponse = await supabase.auth.mfa.challenge({ 
        factorId 
      });

      if (challengeResponse.error) throw challengeResponse.error;

      // Then verify the code
      const verifyResponse = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeResponse.data.id,
        code: verifyCode,
      });

      if (verifyResponse.error) throw verifyResponse.error;

      toast({
        title: "2FA Enabled!",
        description: "Two-factor authentication is now active on your account",
      });

      setQrCode(null);
      setSecret(null);
      setFactorId(null);
      setVerifyCode("");
      window.location.reload();
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

  if (qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Complete 2FA Setup
          </CardTitle>
          <CardDescription>
            Scan the QR code with Google Authenticator, then enter the 6-digit code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
          
          <div className="space-y-2">
            <Label>Manual Entry Code</Label>
            <Input value={secret || ""} readOnly className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify-code">Verification Code</Label>
            <Input
              id="verify-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
          </div>

          <Button onClick={verifyAndEnable} disabled={isVerifying} className="w-full">
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify and Enable 2FA"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasUnverified = existingFactors.some(f => f.status === "unverified");
  const hasVerified = existingFactors.some(f => f.status === "verified");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your admin account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUnverified && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>You have unverified 2FA setup. Clear it to start fresh.</span>
              <Button 
                onClick={removeUnverifiedFactors} 
                disabled={isRemoving}
                variant="destructive"
                size="sm"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {hasVerified && (
          <Alert>
            <AlertDescription className="flex flex-col gap-2">
              <span>✅ 2FA is currently enabled on your account</span>
              <span className="text-sm text-muted-foreground">
                To fix the "localhost:3000" issue, disable 2FA and re-enable it from your production domain (ineedfilming.com)
              </span>
              <Button 
                onClick={removeAllFactors} 
                disabled={isRemoving}
                variant="destructive"
                size="sm"
                className="w-fit"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disable 2FA & Reset
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Button onClick={enrollMFA} disabled={isEnrolling || hasUnverified || hasVerified}>
          {isEnrolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            "Enable 2FA"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
