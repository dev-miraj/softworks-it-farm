import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useListLeaveRequests, useUpdateLeaveRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
  approved: "bg-green-500/10 text-green-400 border-green-400/20",
  rejected: "bg-red-500/10 text-red-400 border-red-400/20",
};

export function LeavesPage() {
  const { data: leaves, queryKey } = useListLeaveRequests();
  const updateLeave = useUpdateLeaveRequest();
  const qc = useQueryClient();

  const handleAction = async (id: number, status: string) => {
    await updateLeave.mutateAsync({ id, data: { status, approvedBy: "Admin" } });
    await qc.invalidateQueries({ queryKey });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground mb-1">Leave Requests</h1>
        <p className="text-muted-foreground text-sm">Review and approve employee leave requests</p>
      </div>

      <div className="flex flex-col gap-3">
          {leaves?.map((leave) => (
            <div key={leave.id} className="gradient-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{leave.type}</Badge>
                    <Badge variant="outline" className={`text-xs capitalize ${statusColors[leave.status] ?? ""}`}>{leave.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{leave.startDate} → {leave.endDate}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{leave.reason}</p>
                  {leave.approvedBy && (
                    <p className="text-xs text-muted-foreground/60 mt-1">By: {leave.approvedBy}</p>
                  )}
                </div>
                {leave.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8" onClick={() => handleAction(leave.id, "approved")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 h-8" onClick={() => handleAction(leave.id, "rejected")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!leaves || leaves.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">No leave requests found.</div>
          )}
        </div>
    </AdminLayout>
  );
}
