import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pill, Trash2, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/medications")({
  component: MedsPage,
  head: () => ({ meta: [{ title: "My Medications — MedProz" }] }),
});

type Med = {
  id: string; name: string; dosage: string | null; frequency: string | null;
  notes: string | null; start_date: string | null; end_date: string | null; active: boolean;
};

function MedsPage() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data, error } = await supabase.from("medications").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setMeds((data as Med[]) || []);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); load(); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">My Medications</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep track of every prescription and OTC drug you take.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft"><Plus className="size-4" /> Add medication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add a medication</DialogTitle></DialogHeader>
            {user && <AddMedForm onDone={() => { setOpen(false); load(); }} userId={user.id} />}
          </DialogContent>
        </Dialog>
      </div>

      {meds.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/60">
          <div className="size-14 mx-auto grid place-items-center rounded-2xl bg-primary/10 text-primary mb-4 float-slow">
            <Pill className="size-6" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No medications yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add the medicines you take so MedProz can help you remember.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {meds.map((m) => (
            <Card key={m.id} className="p-5 shadow-card border-border/60 hover:shadow-soft transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Pill className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{m.name}</h3>
                    {m.dosage && <p className="text-sm text-muted-foreground">{m.dosage}{m.frequency ? ` • ${m.frequency}` : ""}</p>}
                    {m.notes && <p className="text-xs text-muted-foreground mt-1.5">{m.notes}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex justify-end">
                <Button asChild variant="outline" size="sm">
                  <Link to="/find" search={{ q: m.name }}><Search className="size-3.5" /> Find online</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMedForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("medications").insert({ name, dosage, frequency, notes, user_id: userId });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Added"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Paracetamol" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Dosage</Label><Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="500mg" /></div>
        <div className="space-y-1.5"><Label>Frequency</Label><Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Twice daily" /></div>
      </div>
      <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
      <Button type="submit" className="w-full bg-gradient-primary" disabled={saving}>{saving ? "Saving..." : "Save medication"}</Button>
    </form>
  );
}
