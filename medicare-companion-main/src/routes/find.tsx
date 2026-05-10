import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Globe } from "lucide-react";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/find")({
  component: FindPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Find Medications — MedProz" }] }),
});

const SOURCES = [
  { name: "Google", url: (q: string) => `https://www.google.com/search?q=buy+${encodeURIComponent(q)}+near+me`, color: "from-blue-500 to-blue-600" },
  { name: "Amazon Pharmacy", url: (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&i=hpc`, color: "from-orange-500 to-orange-600" },
  { name: "1mg", url: (q: string) => `https://www.1mg.com/search/all?name=${encodeURIComponent(q)}`, color: "from-emerald-500 to-emerald-600" },
  { name: "Walgreens", url: (q: string) => `https://www.walgreens.com/search/results.jsp?Ntt=${encodeURIComponent(q)}`, color: "from-red-500 to-red-600" },
  { name: "CVS", url: (q: string) => `https://www.cvs.com/search?searchTerm=${encodeURIComponent(q)}`, color: "from-rose-500 to-rose-600" },
  { name: "GoodRx", url: (q: string) => `https://www.goodrx.com/search?query=${encodeURIComponent(q)}`, color: "from-purple-500 to-purple-600" },
  { name: "NetMeds", url: (q: string) => `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(q)}`, color: "from-teal-500 to-teal-600" },
  { name: "Drugs.com", url: (q: string) => `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(q)}`, color: "from-slate-500 to-slate-700" },
];

function FindPage() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q || "");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="text-center mb-8">
        <div className="size-12 mx-auto grid place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-3">
          <Globe className="size-6" />
        </div>
        <h1 className="font-display text-3xl font-bold">Find your medication</h1>
        <p className="text-sm text-muted-foreground mt-2">Search trusted pharmacies and stores. Opens in a new tab.</p>
      </div>

      <Card className="p-4 mb-8 shadow-card border-border/60">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Paracetamol, Ibuprofen…" className="pl-10 h-11" />
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {SOURCES.map((s) => {
          const url = query.trim() ? s.url(query) : "#";
          const disabled = !query.trim();
          return (
            <a
              key={s.name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => disabled && e.preventDefault()}
              className={`group rounded-2xl p-5 bg-card border border-border/60 shadow-card hover:shadow-glow hover:-translate-y-1 transition-all ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className={`size-10 rounded-xl bg-gradient-to-br ${s.color} mb-3 grid place-items-center text-white shadow-soft`}>
                <Globe className="size-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{s.name}</h3>
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-primary transition" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {query.trim() ? `Search "${query}"` : "Enter a medicine first"}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
