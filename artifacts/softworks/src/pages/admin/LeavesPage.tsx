import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListLeaveRequests, useUpdateLeaveRequest, useListEmployees } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, XCircle, User, Clock, Filter } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  approved: "bg-green-500/10 text-green-400 border-green-400/20",
  rejected: "bg-red-500/10 text-red-400 border-red-400/20",
};

const typeColors: Record<string, string> = {
  sick: "bg-red-500/10 text-red-400",
  annual: "bg-blue-500/10 text-blue-400",
  casual: "bg-purple-500/10 text-purple-400",
  maternity: "bg-pink-500/10 text-pink-400",
  unpaid: "bg-gray-500/10 text-gray-400",
};

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export function LeavesPage() {
  const { data: leaves, queryKey } = useListLeaveRequests();
  const { data: employees } = useListEmployees();
  const updateLeave = useUpdateLeaveRequest();
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const employeeMap = useMemo(
    () => Object.fromEntries((employees ?? []).map(e => [e.id, e])),
    [employees]
  );

  const filtered = useMemo(() => {
    if (!leaves) return [];
    return leaves.filter(l => {
      const matchesStatus = filterStatus === "all" || l.status === filterStatus;
      const matchesType = filterType === "all" || l.type === filterType;
      return matchesStatus && matchesType;
    });
  }, [leaves, filterStatus, filterType]);

  const stats = useMemo(() => {
    if (!leaves) return { pending: 0, approved: 0, rejected: 0, total: 0 };
    return {
      total: leaves.length,
      pending: leaves.filter(l => l.status === "pending").length,
      approved: leaves.filter(l => l.status === "approved").length,
      rejected: leaves.filter(l => l.status === "rejected").length,
    };
  }, [leaves]);

  const handleAction = async (id: number, status: string) => {
    await updateLeave.mutateAsync({ id, data: { status, approvedBy: "Admin" } });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-3xl font-black text-foreground mb-1">Leave Requests</h1>
        <p className="text-muted-foreground text-sm">Review and approve employee leave requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400", bg: "bg-yellow-500/10", cursor: true },
          { label: "Approved", value: stats.approved, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Rejected", value: stats.rejected, color: "text-red-400", bg: "bg-red-500/10" },
        ].map(card => (
          <div
            key={card.label}
            className={`rounded-xl p-4 ${card.bg} ${card.cursor ? "cursor-pointer" : ""}`}
            onClick={() => card.cursor && setFilterStatus("pending")}
          >
            <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sick">Sick</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="maternity">Maternity</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
        {(filterStatus !== "all" || filterType !== "all") && (
          <button onClick={() => { setFilterStatus("all"); setFilterType("all"); }} className="text-xs text-muted-foreground hover:text-foreground underline">
            Clear filters
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.map((leave) => {
          const emp = employeeMap[leave.employeeId];
          const days = daysBetween(leave.startDate, leave.endDate);
          return (
            <div key={leave.id} className="gradient-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Employee info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-sm">{emp?.name ?? `Employee #${leave.employeeId}`}</div>
                      <div className="text-xs text-muted-foreground">{emp?.role ?? ""}{emp?.department ? ` · ${emp.department}` : ""}</div>
                    </div>
                  </div>

                  {/* Leave details */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className={`text-xs capitalize ${typeColors[leave.type] ?? ""}`}>{leave.type}</Badge>
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[leave.status] ?? ""}`}>{leave.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{days} day{days !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                    <Calendar className="w-3 h-3" />
                    {leave.startDate} → {leave.endDate}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{leave.reason}"</p>
                  {leave.approvedBy && (
                    <p className="text-xs text-muted-foreground/50 mt-1">Actioned by: {leave.approvedBy}</p>
                  )}
                </div>

                {leave.status === "pending" && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs" onClick={() => handleAction(leave.id, "approved")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 h-8 text-xs" onClick={() => handleAction(leave.id, "rejected")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {filterStatus !== "all" || filterType !== "all" ? "No requests match your filters." : "No leave requests found."}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
