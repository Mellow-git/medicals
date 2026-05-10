import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — MedProz" }] }),
});

type Profile = {
  id: string; full_name: string | null; age: number | null; blood_type: string | null;
  allergies: string | null; conditions: string | null;
};

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setP((data as Profile) || { id: user.id, full_name: "", age: null, blood_type: "", allergies: "", conditions: "" });
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ ...p, id: user.id, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (!user || !p) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-16 grid place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow text-2xl font-bold font-display">
          {(p.full_name || user.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{p.full_name || "Your profile"}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" /> {user.email || "Guest user"}</p>
        </div>
      </div>

      <Card className="p-6 shadow-card border-border/60">
        <form onSubmit={save} className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <UserIcon className="size-4" /> Personal info
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={p.full_name || ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input type="number" value={p.age ?? ""} onChange={(e) => setP({ ...p, age: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="space-y-1.5">
              <Label>Blood type</Label>
              <Input value={p.blood_type || ""} onChange={(e) => setP({ ...p, blood_type: e.target.value })} placeholder="e.g. O+" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-primary pt-2">
            <Heart className="size-4" /> Medical info
          </div>
          <div className="space-y-1.5">
            <Label>Allergies</Label>
            <Textarea rows={2} value={p.allergies || ""} onChange={(e) => setP({ ...p, allergies: e.target.value })} placeholder="Penicillin, peanuts…" />
          </div>
          <div className="space-y-1.5">
            <Label>Existing conditions</Label>
            <Textarea rows={2} value={p.conditions || ""} onChange={(e) => setP({ ...p, conditions: e.target.value })} placeholder="Asthma, hypertension…" />
          </div>

          <Button type="submit" className="bg-gradient-primary shadow-soft" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
