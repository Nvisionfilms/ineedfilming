import { MFASetup } from "@/components/MFASetup";

export default function AdminSecurity() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security and authentication</p>
      </div>

      <MFASetup />
    </div>
  );
}
