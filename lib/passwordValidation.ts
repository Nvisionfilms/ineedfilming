export interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
  met?: boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    label: "At least 12 characters",
    validator: (pwd) => pwd.length >= 12,
  },
  {
    label: "One uppercase letter (A-Z)",
    validator: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "One lowercase letter (a-z)",
    validator: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "One number (0-9)",
    validator: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: "One special character (!@#$%^&*...)",
    validator: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/.test(pwd),
  },
];

export const validatePassword = (password: string): PasswordRequirement[] => {
  return passwordRequirements.map((req) => ({
    ...req,
    met: req.validator(password),
  }));
};

export const isPasswordValid = (password: string): boolean => {
  return passwordRequirements.every((req) => req.validator(password));
};

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = validatePassword(password);
  const metCount = requirements.filter((r) => r.met).length;
  
  if (metCount <= 2) return "weak";
  if (metCount === 3) return "fair";
  if (metCount === 4) return "good";
  return "strong";
};

export const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case "weak":
      return "bg-destructive";
    case "fair":
      return "bg-orange-500";
    case "good":
      return "bg-yellow-500";
    case "strong":
      return "bg-green-500";
  }
};

export const getStrengthText = (strength: PasswordStrength): string => {
  return strength.charAt(0).toUpperCase() + strength.slice(1);
};
