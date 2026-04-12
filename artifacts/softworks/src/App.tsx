import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminAuthProvider, RequireAdminAuth } from "@/contexts/AdminAuthContext";
import { HomePage } from "@/pages/HomePage";
import { ServicesPage } from "@/pages/ServicesPage";
import { PortfolioPage } from "@/pages/PortfolioPage";
import { AboutPage } from "@/pages/AboutPage";
import { SaasPage } from "@/pages/SaasPage";
import { BlogPage } from "@/pages/BlogPage";
import { BlogPostPage } from "@/pages/BlogPostPage";
import { ContactPage } from "@/pages/ContactPage";
import { LoginPage } from "@/pages/admin/LoginPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { LeadsPage } from "@/pages/admin/LeadsPage";
import { EmployeesPage } from "@/pages/admin/EmployeesPage";
import { ProjectsPage } from "@/pages/admin/ProjectsPage";
import { ClientsPage } from "@/pages/admin/ClientsPage";
import { LeavesPage } from "@/pages/admin/LeavesPage";
import { PayrollPage } from "@/pages/admin/PayrollPage";
import { AttendancePage } from "@/pages/admin/AttendancePage";
import { ServicesAdminPage } from "@/pages/admin/ServicesAdminPage";
import { PortfolioAdminPage } from "@/pages/admin/PortfolioAdminPage";
import { BlogAdminPage } from "@/pages/admin/BlogAdminPage";
import { TestimonialsAdminPage } from "@/pages/admin/TestimonialsAdminPage";
import { TeamAdminPage } from "@/pages/admin/TeamAdminPage";
import { SaasAdminPage } from "@/pages/admin/SaasAdminPage";
import { LicensesPage } from "@/pages/admin/LicensesPage";
import { LicenseDashboardPage } from "@/pages/admin/LicenseDashboardPage";
import { LicenseProductsPage } from "@/pages/admin/LicenseProductsPage";
import { LicenseActivationsPage } from "@/pages/admin/LicenseActivationsPage";
import { LicensePaymentsPage } from "@/pages/admin/LicensePaymentsPage";
import { LicenseLogsPage } from "@/pages/admin/LicenseLogsPage";
import { PaymentMethodsPage } from "@/pages/admin/PaymentMethodsPage";
import { ApiKeysPage } from "@/pages/admin/ApiKeysPage";
import { ReportsPage } from "@/pages/admin/ReportsPage";
import { LicenseVerifyPage } from "@/pages/LicenseVerifyPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAdminAuth>
      <Component />
    </RequireAdminAuth>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <PublicLayout><HomePage /></PublicLayout>
      </Route>
      <Route path="/services">
        <PublicLayout><ServicesPage /></PublicLayout>
      </Route>
      <Route path="/portfolio">
        <PublicLayout><PortfolioPage /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><AboutPage /></PublicLayout>
      </Route>
      <Route path="/saas">
        <PublicLayout><SaasPage /></PublicLayout>
      </Route>
      <Route path="/blog">
        <PublicLayout><BlogPage /></PublicLayout>
      </Route>
      <Route path="/blog/:id">
        {(params) => (
          <PublicLayout><BlogPostPage id={Number(params.id)} /></PublicLayout>
        )}
      </Route>
      <Route path="/contact">
        <PublicLayout><ContactPage /></PublicLayout>
      </Route>
      <Route path="/verify-license">
        <PublicLayout><LicenseVerifyPage /></PublicLayout>
      </Route>

      {/* Admin Login — public */}
      <Route path="/admin/login" component={LoginPage} />

      {/* Admin routes — protected */}
      <Route path="/admin"><AdminRoute component={DashboardPage} /></Route>
      <Route path="/admin/leads"><AdminRoute component={LeadsPage} /></Route>
      <Route path="/admin/employees"><AdminRoute component={EmployeesPage} /></Route>
      <Route path="/admin/projects"><AdminRoute component={ProjectsPage} /></Route>
      <Route path="/admin/clients"><AdminRoute component={ClientsPage} /></Route>
      <Route path="/admin/leaves"><AdminRoute component={LeavesPage} /></Route>
      <Route path="/admin/payroll"><AdminRoute component={PayrollPage} /></Route>
      <Route path="/admin/attendance"><AdminRoute component={AttendancePage} /></Route>
      <Route path="/admin/services"><AdminRoute component={ServicesAdminPage} /></Route>
      <Route path="/admin/portfolio"><AdminRoute component={PortfolioAdminPage} /></Route>
      <Route path="/admin/blog"><AdminRoute component={BlogAdminPage} /></Route>
      <Route path="/admin/testimonials"><AdminRoute component={TestimonialsAdminPage} /></Route>
      <Route path="/admin/team"><AdminRoute component={TeamAdminPage} /></Route>
      <Route path="/admin/saas-products"><AdminRoute component={SaasAdminPage} /></Route>
      <Route path="/admin/license-dashboard"><AdminRoute component={LicenseDashboardPage} /></Route>
      <Route path="/admin/licenses"><AdminRoute component={LicensesPage} /></Route>
      <Route path="/admin/license-products"><AdminRoute component={LicenseProductsPage} /></Route>
      <Route path="/admin/license-activations"><AdminRoute component={LicenseActivationsPage} /></Route>
      <Route path="/admin/license-payments"><AdminRoute component={LicensePaymentsPage} /></Route>
      <Route path="/admin/license-logs"><AdminRoute component={LicenseLogsPage} /></Route>
      <Route path="/admin/payment-methods"><AdminRoute component={PaymentMethodsPage} /></Route>
      <Route path="/admin/api-keys"><AdminRoute component={ApiKeysPage} /></Route>
      <Route path="/admin/reports"><AdminRoute component={ReportsPage} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
