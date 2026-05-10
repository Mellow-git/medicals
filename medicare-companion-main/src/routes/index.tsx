import { createFileRoute, Link } from "@tanstack/react-router";
import { Hospital3D } from "@/components/Hospital3D";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Pill, Search, Image, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "MedProz — Your AI Medical Helpline" },
      { name: "description", content: "Get instant medicine suggestions, track your prescriptions, find pharmacies, and identify pills from photos." },
    ],
  }),
});

function Index() {
  return (
    <div className="bg-gradient-soft">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-20 md:pt-20">
        <div className="grid md:grid-cols-2 items-center gap-12">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> AI-powered medical helpline
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] text-balance">
              Your pocket <span className="text-primary">medical</span> assistant.
            </h1>
            <p className="text-lg text-muted-foreground text-balance max-w-md">
              Chat with MedProz for medicine suggestions, snap a photo to identify pills, track your prescriptions, and find where to buy them online.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow text-base">
                <Link to="/chat">
                  <MessageCircle className="size-4" /> Start chatting
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link to="/gallery">
                  Identify a pill <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="size-4 text-primary" />
              Not a substitute for a licensed doctor — always consult a professional.
            </div>
          </div>

          <div className="relative aspect-square max-w-lg justify-self-center w-full">
            <Hospital3D className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid md:grid-cols-4 gap-4">
          <Feature icon={MessageCircle} title="Smart Chat" desc="Ask about symptoms and get OTC medicine suggestions instantly." />
          <Feature icon={Pill} title="Med Tracker" desc="Save your medications with dosage, frequency, and schedule." />
          <Feature icon={Search} title="Find Online" desc="Quick links to pharmacies and stores that stock your meds." />
          <Feature icon={Image} title="Photo Identify" desc="Upload a pill or box photo to identify the medicine." />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-card border border-border/60 hover:shadow-soft hover:-translate-y-0.5 transition-all">
      <div className="size-10 grid place-items-center rounded-xl bg-primary/10 text-primary mb-3">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
