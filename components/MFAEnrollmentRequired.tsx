import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MFAEnrollmentRequired = () => {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const enrollMFA = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);

      toast({
        title: "QR Code Generated",
        description: "Scan this code with your authenticator app",
      });
    } catch (error: any) {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });

      if (verify.error) throw verify.error;

      toast({
        title: "2FA Enabled Successfully",
        description: "You can now access the admin portal",
      });

      // Refresh the page to trigger authentication checks
      window.location.href = "/admin/bookings";
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">2FA Required</CardTitle>
          <CardDescription>
            Two-factor authentication is mandatory for admin access. Please set up 2FA to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!qrCode ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Click the button below to generate your 2FA QR code
              </p>
              <Button
                onClick={enrollMFA}
                disabled={isEnrolling}
                className="w-full"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Manual Entry Code</Label>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {secret}
                </code>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter 6-Digit Code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                />
              </div>

              <Button
                onClick={verifyAndEnable}
                disabled={isVerifying || verifyCode.length !== 6}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify and Enable 2FA"
                )}
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
