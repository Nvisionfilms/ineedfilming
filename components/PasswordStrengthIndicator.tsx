import { Check, X } from "lucide-react";
import { validatePassword, calculatePasswordStrength, getStrengthColor, getStrengthText } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator = ({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) => {
  const requirements = validatePassword(password);
  const strength = calculatePasswordStrength(password);
  const strengthColor = getStrengthColor(strength);
  const strengthText = getStrengthText(strength);
  const metCount = requirements.filter((r) => r.met).length;

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={`font-medium ${
            strength === "weak" ? "text-destructive" :
            strength === "fair" ? "text-orange-500" :
            strength === "good" ? "text-yellow-500" :
            "text-green-500"
          }`}>
            {strengthText}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(metCount / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 text-xs"
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
              <span className={req.met ? "text-muted-foreground" : "text-muted-foreground/60"}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
