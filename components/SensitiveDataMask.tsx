import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

interface SensitiveDataMaskProps {
  data: string;
  type: "email" | "phone";
  recordId?: string;
  tableName?: string;
}

export function SensitiveDataMask({ data, type, recordId, tableName }: SensitiveDataMaskProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");
    if (username.length <= 2) return `${username[0]}***@${domain}`;
    return `${username[0]}***@${domain}`;
  };

  const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ***-${digits.slice(-4)}`;
    }
    return `***-${digits.slice(-4)}`;
  };

  const logAccess = async () => {
    if (!recordId || !tableName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("admin_audit_log" as any).insert({
        admin_user_id: user.id,
        admin_email: user.email || "unknown",
        action: "SELECT",
        table_name: tableName,
        record_id: recordId,
        reason: `Revealed ${type}`,
      });
    } catch (error) {
      // Don't block UI if audit logging fails
      console.error("Audit log failed:", error);
    }
  };

  const handleReveal = async () => {
    if (isRevealed) {
      // Hide immediately
      if (timer) clearTimeout(timer);
      setIsRevealed(false);
      setTimer(null);
      return;
    }

    // Log the access
    await logAccess();

    // Show for 10 seconds
    setIsRevealed(true);
    const newTimer = setTimeout(() => {
      setIsRevealed(false);
      setTimer(null);
    }, 10000);
    setTimer(newTimer);
  };

  const maskedData = type === "email" ? maskEmail(data) : maskPhone(data);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">
        {isRevealed ? data : maskedData}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReveal}
        className="h-6 w-6 p-0"
      >
        {isRevealed ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
