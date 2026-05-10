import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Image as ImgIcon, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({ meta: [{ title: "Gallery — MedProz" }] }),
});

type Item = { id: string; image_url: string; medicine_name: string | null; notes: string | null; ai_analysis: string | null };

function GalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data } = await supabase.from("gallery_items").select("*").order("created_at", { ascending: false });
    setItems((data as Item[]) || []);
  };

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("gallery").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(path);
      const imageUrl = pub.publicUrl;

      // Ask AI to analyze
      toast.info("Analyzing photo with AI…");
      const aiResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/identify-medicine`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ imageUrl, notes }),
      });
      const aiData = await aiResp.json();
      const analysis = aiData.analysis || null;

      const { error: insErr } = await supabase.from("gallery_items").insert({
        user_id: user.id, image_url: imageUrl, medicine_name: name || null, notes: notes || null, ai_analysis: analysis,
      });
      if (insErr) throw insErr;

      toast.success("Photo added");
      setName(""); setNotes("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (item: Item) => {
    await supabase.from("gallery_items").delete().eq("id", item.id);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Medicine Gallery</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload photos of your medicines and let AI tell you about them.</p>
      </div>

      <Card className="p-5 mb-6 shadow-card border-border/60">
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Medicine name (optional)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aspirin" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="prescribed for…" />
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full bg-gradient-primary shadow-soft h-11">
              <Upload className="size-4" /> {uploading ? "Uploading…" : "Upload photo"}
            </Button>
          </div>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/60">
          <div className="size-14 mx-auto grid place-items-center rounded-2xl bg-primary/10 text-primary mb-4 float-slow">
            <ImgIcon className="size-6" />
          </div>
          <h3 className="font-semibold text-lg">No photos yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload a photo of a pill, box, or label.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <Card key={it.id} className="overflow-hidden shadow-card border-border/60 group cursor-pointer hover:shadow-glow transition" onClick={() => setSelected(it)}>
              <div className="aspect-square bg-muted overflow-hidden relative">
                <img src={it.image_url} alt={it.medicine_name || "medicine"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {it.ai_analysis && (
                  <div className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
                    <Sparkles className="size-3.5" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{it.medicine_name || "Unnamed"}</p>
                {it.notes && <p className="text-xs text-muted-foreground truncate">{it.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selected?.medicine_name || "Medicine details"}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <img src={selected.image_url} alt="" className="w-full max-h-72 object-contain rounded-lg bg-muted" />
              {selected.notes && <p className="text-sm text-muted-foreground"><strong>Your notes:</strong> {selected.notes}</p>}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2 text-primary font-semibold text-sm">
                  <Sparkles className="size-4" /> AI Analysis
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selected.ai_analysis || "No analysis available."}</ReactMarkdown>
                </div>
              </div>
              <Button variant="outline" onClick={() => { remove(selected); setSelected(null); }} className="text-destructive">
                <Trash2 className="size-4" /> Delete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
