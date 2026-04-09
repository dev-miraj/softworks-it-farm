import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListLeads, useUpdateLead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Building2, MessageSquare } from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  converted: "bg-green-500/10 text-green-400 border-green-400/20",
  lost: "bg-red-500/10 text-red-400 border-red-400/20",
};

export function LeadsPage() {
  const { data: leads, queryKey } = useListLeads();
  const updateLead = useUpdateLead();
  const qc = useQueryClient();
  const [expandedLead, setExpandedLead] = useState<number | null>(null);

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateLead.mutateAsync({ id, data: { status } });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1">Leads</h1>
          <p className="text-muted-foreground text-sm">Contact form submissions and inquiries</p>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
          {leads?.length ?? 0} Total
        </Badge>
      </div>

      <div className="flex flex-col gap-3">
          {leads?.map((lead) => (
            <div key={lead.id} className="gradient-border rounded-xl p-5 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-foreground">{lead.name}</span>
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[lead.status] ?? ""}`}>{lead.status}</Badge>
                    {lead.service && <Badge variant="secondary" className="text-xs">{lead.service}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mb-2">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                    {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                    {lead.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.company}</span>}
                    <span className="text-muted-foreground/60">{new Date(lead.createdAt).toLocaleDateString()}</span>
                  </div>
                  {expandedLead === lead.id && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {lead.message}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                    className="text-xs text-muted-foreground"
                  >
                    {expandedLead === lead.id ? "Hide" : "View"}
                  </Button>
                  <Select onValueChange={(val) => handleUpdateStatus(lead.id, val)} defaultValue={lead.status}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          {(!leads || leads.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">No leads yet.</div>
          )}
        </div>
    </AdminLayout>
  );
}
