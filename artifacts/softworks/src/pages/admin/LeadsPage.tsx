import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListLeads, useUpdateLead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Building2, MessageSquare, Search, Trash2, Copy, Check } from "lucide-react";

import { API } from "@/lib/apiUrl";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  converted: "bg-green-500/10 text-green-400 border-green-400/20",
  lost: "bg-red-500/10 text-red-400 border-red-400/20",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function LeadsPage() {
  const { data: leads, queryKey } = useListLeads();
  const updateLead = useUpdateLead();
  const qc = useQueryClient();
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateLead.mutateAsync({ id, data: { status } });
    await qc.invalidateQueries({ queryKey });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/leads/${id}`, { method: "DELETE" });
      await qc.invalidateQueries({ queryKey });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => {
      const q = search.toLowerCase();
      const matchesSearch = !search || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company ?? "").toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || l.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, filterStatus]);

  const counts = useMemo(() => {
    if (!leads) return {} as Record<string, number>;
    return leads.reduce((acc: Record<string, number>, l) => { acc[l.status] = (acc[l.status] ?? 0) + 1; return acc; }, {});
  }, [leads]);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Leads</h1>
          <p className="text-muted-foreground text-sm">Contact form submissions and inquiries</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["new", "contacted", "converted", "lost"].map(status => (
            <Badge
              key={status}
              variant="outline"
              className={`capitalize text-xs cursor-pointer ${filterStatus === status ? statusColors[status] : ""}`}
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
            >
              {status}: {counts[status] ?? 0}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, company..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((lead) => (
          <div key={lead.id} className="gradient-border rounded-xl p-4 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-bold text-foreground">{lead.name}</span>
                  <Badge variant="outline" className={`text-xs capitalize ${statusColors[lead.status] ?? ""}`}>{lead.status}</Badge>
                  {lead.service && <Badge variant="secondary" className="text-xs">{lead.service}</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-52">{lead.email}</span>
                    <CopyButton value={lead.email} />
                  </span>
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  {lead.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.company}</span>}
                  <span className="text-muted-foreground/50">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
                {expandedLead === lead.id && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/30 flex items-start gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {lead.message}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                >
                  {expandedLead === lead.id ? "Hide" : "Message"}
                </button>
                <Select onValueChange={(val) => handleUpdateStatus(lead.id, val)} defaultValue={lead.status}>
                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleDelete(lead.id, lead.name)}
                  disabled={deleting === lead.id}
                  className="p-1.5 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            {search || filterStatus !== "all" ? "No leads match your filters." : "No leads yet."}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
