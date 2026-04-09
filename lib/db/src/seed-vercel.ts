/**
 * seed-vercel.ts
 * Safe seed script for Vercel deployment.
 * Only seeds data if tables are empty — preserves any existing admin-created data.
 * Runs automatically as part of the Vercel build command.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  servicesTable, portfolioTable, blogTable, leadsTable,
  testimonialsTable, teamTable, saasProductsTable, employeesTable,
  attendanceTable, leavesTable, payrollTable, projectsTable, clientsTable,
  licensesTable, paymentMethodsTable,
} from "./schema/index";

const rawUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!rawUrl) {
  console.log("⚠️  No database URL set — skipping seed.");
  process.exit(0);
}

let url = rawUrl;
try { const u = new URL(rawUrl); u.searchParams.delete("channel_binding"); url = u.toString(); } catch { /* use raw */ }
const isNeon = url.includes("neon.tech");
const pool = new pg.Pool({
  connectionString: url,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});
const db = drizzle(pool);

async function seedIfEmpty() {
  console.log("🌱 SOFTWORKS → Vercel DB seed (safe mode)\n");

  // ── Services ─────────────────────────────────────────────────────────────
  const existingServices = await db.select().from(servicesTable).limit(1);
  if (existingServices.length === 0) {
    await db.insert(servicesTable).values([
      { title: "Custom Software Development", description: "Tailor-made software solutions built to meet your exact business needs.", icon: "Code", category: "Development", features: ["Web Apps", "Mobile Apps", "API Integration", "Cloud-native"], isActive: true },
      { title: "Cloud Infrastructure & DevOps", description: "Scalable, secure cloud architecture and CI/CD pipeline automation.", icon: "Cloud", category: "Infrastructure", features: ["AWS/GCP/Azure", "Kubernetes", "Terraform", "24/7 Monitoring"], isActive: true },
      { title: "AI & Machine Learning", description: "Intelligent automation and predictive analytics powered by cutting-edge ML.", icon: "Brain", category: "AI", features: ["NLP Models", "Computer Vision", "Data Pipelines", "Model Deployment"], isActive: true },
      { title: "Cybersecurity", description: "Comprehensive security audits, penetration testing, and compliance management.", icon: "Shield", category: "Security", features: ["Pen Testing", "SOC 2 Compliance", "Threat Detection", "Zero Trust"], isActive: true },
      { title: "UI/UX Design", description: "User-first design systems and stunning interfaces that convert.", icon: "Palette", category: "Design", features: ["Figma Prototypes", "Design Systems", "User Research", "Accessibility"], isActive: true },
      { title: "IT Consulting", description: "Strategic technology guidance to transform and future-proof your business.", icon: "Lightbulb", category: "Consulting", features: ["Digital Strategy", "Tech Audits", "Roadmapping", "CTO as a Service"], isActive: true },
    ]);
    console.log("  ✔ services seeded");
  } else {
    console.log("  ↩ services already populated — skip");
  }

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const existingPortfolio = await db.select().from(portfolioTable).limit(1);
  if (existingPortfolio.length === 0) {
    await db.insert(portfolioTable).values([
      { title: "FinTech Payment Gateway", description: "Real-time payment processing platform handling $2B+ annual transactions.", category: "Fintech", technologies: ["Node.js", "React", "PostgreSQL", "Redis", "Stripe"], imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800", clientName: "PaySwift Inc.", isFeatured: true },
      { title: "AI-Powered Supply Chain", description: "Predictive inventory management reducing stockouts by 78% using ML.", category: "AI/ML", technologies: ["Python", "TensorFlow", "FastAPI", "React", "AWS"], imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800", clientName: "LogiTech Corp", isFeatured: true },
      { title: "Healthcare SaaS Platform", description: "HIPAA-compliant patient management system serving 500+ clinics.", category: "Healthcare", technologies: ["Next.js", "Django", "PostgreSQL", "Docker", "Kubernetes"], imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800", clientName: "MediCore Solutions", isFeatured: true },
      { title: "E-Commerce Marketplace", description: "Multi-vendor marketplace with real-time inventory and AI recommendations.", category: "E-Commerce", technologies: ["React", "Node.js", "MongoDB", "Elasticsearch", "Stripe"], imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800", clientName: "ShopBridge Ltd.", isFeatured: false },
      { title: "Real Estate Platform", description: "Property listing platform with AR virtual tours and smart pricing.", category: "PropTech", technologies: ["React Native", "Three.js", "Python", "AWS S3"], imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800", clientName: "HomeSmart Realty", isFeatured: false },
      { title: "EdTech Learning Platform", description: "Adaptive learning system with AI-driven personalized curricula.", category: "EdTech", technologies: ["Vue.js", "Django", "PostgreSQL", "WebRTC", "ML"], imageUrl: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800", clientName: "EduNova Academy", isFeatured: false },
    ]);
    console.log("  ✔ portfolio seeded");
  } else {
    console.log("  ↩ portfolio already populated — skip");
  }

  // ── Blog ──────────────────────────────────────────────────────────────────
  const existingBlog = await db.select().from(blogTable).limit(1);
  if (existingBlog.length === 0) {
    await db.insert(blogTable).values([
      { title: "The Future of AI in Enterprise Software", slug: "future-ai-enterprise-software", excerpt: "How artificial intelligence is reshaping the enterprise software landscape in 2025.", content: "Artificial intelligence is no longer a buzzword — it is the foundation of modern enterprise software.", category: "AI & Technology", tags: ["AI", "Enterprise", "Machine Learning"], imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800", authorName: "Dr. Arjun Mehta", isPublished: true, publishedAt: new Date("2025-03-15") },
      { title: "Cloud-Native Architecture Best Practices", slug: "cloud-native-architecture-best-practices", excerpt: "Building resilient, scalable applications using microservices and Kubernetes.", content: "Cloud-native architecture is a design approach that embraces the principles of scalability and resilience.", category: "Cloud & DevOps", tags: ["Cloud", "Kubernetes", "DevOps"], imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800", authorName: "Sarah Okonkwo", isPublished: true, publishedAt: new Date("2025-02-20") },
      { title: "Zero Trust Security: A Practical Guide", slug: "zero-trust-security-practical-guide", excerpt: "Implementing zero trust architecture to protect modern distributed systems.", content: "Zero trust is a security model that requires strict identity verification for every person and device.", category: "Cybersecurity", tags: ["Security", "Zero Trust", "Compliance"], imageUrl: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800", authorName: "Marcus Chen", isPublished: true, publishedAt: new Date("2025-01-10") },
    ]);
    console.log("  ✔ blog seeded");
  } else {
    console.log("  ↩ blog already populated — skip");
  }

  // ── Testimonials ──────────────────────────────────────────────────────────
  const existingTestimonials = await db.select().from(testimonialsTable).limit(1);
  if (existingTestimonials.length === 0) {
    await db.insert(testimonialsTable).values([
      { clientName: "Jessica Williams", role: "CTO", company: "NovaTech Inc.", rating: 5, content: "SOFTWORKS transformed our legacy systems into a modern cloud infrastructure. Our deployment frequency went from monthly to daily.", avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg", isActive: true },
      { clientName: "David Kim", role: "VP Engineering", company: "FinanceEdge", rating: 5, content: "The AI-powered fraud detection system they built has saved us millions. The team is incredibly professional and skilled.", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg", isActive: true },
      { clientName: "Priya Sharma", role: "CEO", company: "HealthBridge", rating: 5, content: "From concept to launch in 4 months. SOFTWORKS delivered a HIPAA-compliant platform that our doctors love.", avatarUrl: "https://randomuser.me/api/portraits/women/65.jpg", isActive: true },
    ]);
    console.log("  ✔ testimonials seeded");
  } else {
    console.log("  ↩ testimonials already populated — skip");
  }

  // ── Team ──────────────────────────────────────────────────────────────────
  const existingTeam = await db.select().from(teamTable).limit(1);
  if (existingTeam.length === 0) {
    await db.insert(teamTable).values([
      { name: "Rajan Kapoor", role: "Founder & CEO", department: "Leadership", bio: "15+ years building enterprise software. Previously at Google and Microsoft.", avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg", skills: ["Strategy", "Product", "Leadership"], linkedinUrl: "https://linkedin.com", isActive: true },
      { name: "Dr. Arjun Mehta", role: "Chief AI Officer", department: "AI & Research", bio: "PhD in Machine Learning from MIT. Led AI initiatives at Amazon.", avatarUrl: "https://randomuser.me/api/portraits/men/45.jpg", skills: ["Machine Learning", "Deep Learning", "Python", "Research"], linkedinUrl: "https://linkedin.com", isActive: true },
      { name: "Sarah Okonkwo", role: "Head of Cloud", department: "Infrastructure", bio: "AWS and GCP certified architect with 10 years of DevOps experience.", avatarUrl: "https://randomuser.me/api/portraits/women/52.jpg", skills: ["AWS", "Kubernetes", "Terraform", "DevOps"], linkedinUrl: "https://linkedin.com", isActive: true },
      { name: "Marcus Chen", role: "Security Lead", department: "Cybersecurity", bio: "CISSP certified with background in government cybersecurity.", avatarUrl: "https://randomuser.me/api/portraits/men/36.jpg", skills: ["Penetration Testing", "SIEM", "Compliance", "Zero Trust"], linkedinUrl: "https://linkedin.com", isActive: true },
    ]);
    console.log("  ✔ team seeded");
  } else {
    console.log("  ↩ team already populated — skip");
  }

  // ── SaaS Products ─────────────────────────────────────────────────────────
  const existingSaas = await db.select().from(saasProductsTable).limit(1);
  if (existingSaas.length === 0) {
    await db.insert(saasProductsTable).values([
      { name: "TaskFlow Pro", description: "AI-powered project management for distributed tech teams.", category: "Productivity", status: "active", features: ["AI Task Prioritization", "Time Tracking", "Gantt Charts", "Slack Integration"], pricingMonthly: "29", pricingYearly: "290", demoUrl: "https://taskflow.softworks.com", isActive: true },
      { name: "SecureVault", description: "Enterprise password and secrets manager with zero-knowledge encryption.", category: "Security", status: "active", features: ["Zero-Knowledge", "SSO Integration", "Audit Logs", "API Access"], pricingMonthly: "49", pricingYearly: "490", demoUrl: "https://vault.softworks.com", isActive: true },
      { name: "DataSight", description: "Real-time business intelligence dashboard for engineering metrics.", category: "Analytics", status: "beta", features: ["Real-time Dashboards", "Custom Metrics", "Alerts", "API Integrations"], pricingMonthly: "79", pricingYearly: "790", demoUrl: "https://datasight.softworks.com", isActive: true },
    ]);
    console.log("  ✔ saas products seeded");
  } else {
    console.log("  ↩ saas products already populated — skip");
  }

  // ── Employees ─────────────────────────────────────────────────────────────
  const existingEmployees = await db.select().from(employeesTable).limit(1);
  if (existingEmployees.length === 0) {
    await db.insert(employeesTable).values([
      { employeeId: "EMP001", name: "Rajan Kapoor", email: "rajan@softworks.io", phone: "+1-555-0101", department: "Leadership", role: "CEO", salary: "15000", joinDate: "2020-01-15", status: "active" },
      { employeeId: "EMP002", name: "Dr. Arjun Mehta", email: "arjun@softworks.io", phone: "+1-555-0102", department: "AI & Research", role: "Chief AI Officer", salary: "12000", joinDate: "2020-03-01", status: "active" },
      { employeeId: "EMP003", name: "Sarah Okonkwo", email: "sarah@softworks.io", phone: "+1-555-0103", department: "Infrastructure", role: "Head of Cloud", salary: "11000", joinDate: "2021-06-15", status: "active" },
      { employeeId: "EMP004", name: "Marcus Chen", email: "marcus@softworks.io", phone: "+1-555-0104", department: "Cybersecurity", role: "Security Lead", salary: "10500", joinDate: "2021-08-01", status: "active" },
      { employeeId: "EMP005", name: "Priya Patel", email: "priya@softworks.io", phone: "+1-555-0105", department: "Development", role: "Senior Developer", salary: "9500", joinDate: "2022-01-10", status: "active" },
      { employeeId: "EMP006", name: "James Osei", email: "james@softworks.io", phone: "+1-555-0106", department: "Design", role: "Lead Designer", salary: "8500", joinDate: "2022-04-20", status: "active" },
    ]);
    console.log("  ✔ employees seeded");
  } else {
    console.log("  ↩ employees already populated — skip");
  }

  // ── Clients ───────────────────────────────────────────────────────────────
  const existingClients = await db.select().from(clientsTable).limit(1);
  if (existingClients.length === 0) {
    await db.insert(clientsTable).values([
      { name: "Jessica Williams", email: "jessica@novatech.com", phone: "+1-555-1001", company: "NovaTech Inc.", country: "USA", status: "active", totalProjects: 3 },
      { name: "David Kim", email: "david@financeedge.com", phone: "+1-555-1002", company: "FinanceEdge", country: "Canada", status: "active", totalProjects: 2 },
      { name: "Priya Sharma", email: "priya@healthbridge.com", phone: "+1-555-1003", company: "HealthBridge", country: "UK", status: "active", totalProjects: 1 },
      { name: "Carlos Mendez", email: "carlos@payswift.com", phone: "+1-555-1004", company: "PaySwift Inc.", country: "USA", status: "active", totalProjects: 2 },
      { name: "Aisha Mohammed", email: "aisha@logitech.com", phone: "+1-555-1005", company: "LogiTech Corp", country: "UAE", status: "active", totalProjects: 1 },
    ]);
    console.log("  ✔ clients seeded");
  } else {
    console.log("  ↩ clients already populated — skip");
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  const existingProjects = await db.select().from(projectsTable).limit(1);
  if (existingProjects.length === 0) {
    await db.insert(projectsTable).values([
      { name: "FinTech Payment Gateway", description: "Real-time payment processing platform", clientId: 4, clientName: "PaySwift Inc.", status: "completed", priority: "high", budget: "250000", startDate: "2024-01-01", endDate: "2024-06-30", progress: 100, technologies: ["Node.js", "React", "PostgreSQL"] },
      { name: "AI Supply Chain Optimizer", description: "ML-based inventory management system", clientId: 5, clientName: "LogiTech Corp", status: "active", priority: "high", budget: "180000", startDate: "2024-07-01", endDate: "2025-03-31", progress: 75, technologies: ["Python", "TensorFlow", "FastAPI"] },
      { name: "Healthcare SaaS Platform", description: "HIPAA-compliant patient management system", clientId: 3, clientName: "HealthBridge", status: "active", priority: "critical", budget: "320000", startDate: "2024-09-01", endDate: "2025-06-30", progress: 45, technologies: ["Next.js", "Django", "PostgreSQL"] },
      { name: "Cloud Migration Project", description: "Moving on-prem infrastructure to AWS", clientId: 1, clientName: "NovaTech Inc.", status: "completed", priority: "medium", budget: "95000", startDate: "2024-03-01", endDate: "2024-08-31", progress: 100, technologies: ["AWS", "Terraform", "Kubernetes"] },
    ]);
    console.log("  ✔ projects seeded");
  } else {
    console.log("  ↩ projects already populated — skip");
  }

  // ── Leads ─────────────────────────────────────────────────────────────────
  const existingLeads = await db.select().from(leadsTable).limit(1);
  if (existingLeads.length === 0) {
    await db.insert(leadsTable).values([
      { name: "Alex Turner", email: "alex@startup.io", phone: "+1-555-2001", company: "TechStart", service: "Custom Software Development", message: "Looking for a team to build our MVP.", status: "new" },
      { name: "Maria Garcia", email: "maria@globalbank.com", phone: "+1-555-2002", company: "Global Bank", service: "AI & Machine Learning", message: "Need AI for fraud detection.", status: "contacted" },
      { name: "John Smith", email: "john@retailco.com", phone: "+1-555-2003", company: "RetailCo", service: "E-Commerce Platform", message: "Building a multi-vendor marketplace.", status: "proposal" },
    ]);
    console.log("  ✔ leads seeded");
  } else {
    console.log("  ↩ leads already populated — skip");
  }

  // ── Attendance ────────────────────────────────────────────────────────────
  const existingAttendance = await db.select().from(attendanceTable).limit(1);
  if (existingAttendance.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    await db.insert(attendanceTable).values([
      { employeeId: 1, date: today, checkIn: "09:05", checkOut: "18:00", status: "present" },
      { employeeId: 2, date: today, checkIn: "09:30", checkOut: "18:30", status: "present" },
      { employeeId: 3, date: today, checkIn: "08:55", checkOut: "17:45", status: "present" },
      { employeeId: 4, date: today, checkIn: "10:00", checkOut: "18:00", status: "late" },
      { employeeId: 5, date: today, status: "absent" },
      { employeeId: 6, date: today, checkIn: "09:00", checkOut: "17:00", status: "present" },
    ]);
    console.log("  ✔ attendance seeded");
  } else {
    console.log("  ↩ attendance already populated — skip");
  }

  // ── Leaves ────────────────────────────────────────────────────────────────
  const existingLeaves = await db.select().from(leavesTable).limit(1);
  if (existingLeaves.length === 0) {
    const today = new Date().toISOString().split("T")[0];
    await db.insert(leavesTable).values([
      { employeeId: 5, type: "sick", startDate: today, endDate: today, reason: "Fever and cold", status: "pending" },
      { employeeId: 3, type: "vacation", startDate: "2025-05-01", endDate: "2025-05-07", reason: "Family vacation", status: "approved", approvedBy: "Rajan Kapoor" },
    ]);
    console.log("  ✔ leaves seeded");
  } else {
    console.log("  ↩ leaves already populated — skip");
  }

  // ── Payroll ───────────────────────────────────────────────────────────────
  const existingPayroll = await db.select().from(payrollTable).limit(1);
  if (existingPayroll.length === 0) {
    const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    await db.insert(payrollTable).values([
      { employeeId: 1, month: thisMonth, basicSalary: "15000", bonus: "2000", deductions: "1500", netSalary: "15500", status: "paid" },
      { employeeId: 2, month: thisMonth, basicSalary: "12000", bonus: "1500", deductions: "1200", netSalary: "12300", status: "paid" },
      { employeeId: 3, month: thisMonth, basicSalary: "11000", bonus: "1000", deductions: "1100", netSalary: "10900", status: "pending" },
      { employeeId: 4, month: thisMonth, basicSalary: "10500", bonus: "500", deductions: "1050", netSalary: "9950", status: "pending" },
      { employeeId: 5, month: thisMonth, basicSalary: "9500", bonus: "0", deductions: "950", netSalary: "8550", status: "pending" },
      { employeeId: 6, month: thisMonth, basicSalary: "8500", bonus: "800", deductions: "850", netSalary: "8450", status: "pending" },
    ]);
    console.log("  ✔ payroll seeded");
  } else {
    console.log("  ↩ payroll already populated — skip");
  }

  // ── Payment Methods ───────────────────────────────────────────────────────
  const existingPaymentMethods = await db.select().from(paymentMethodsTable).limit(1);
  if (existingPaymentMethods.length === 0) {
    await db.insert(paymentMethodsTable).values([
      { name: "bKash", type: "mfs", category: "mfs", accountName: "SOFTWORKS IT FARM", accountNumber: "01712-345678", instructions: "Send to merchant number. Use reference: INV-XXXX", emoji: "🟣", isActive: true },
      { name: "Nagad", type: "mfs", category: "mfs", accountName: "SOFTWORKS IT FARM", accountNumber: "01812-345678", instructions: "Send to merchant number. Use reference: INV-XXXX", emoji: "🟠", isActive: true },
      { name: "Rocket", type: "mfs", category: "mfs", accountName: "SOFTWORKS IT FARM", accountNumber: "01555-345678", instructions: "Send to DBBL Rocket number. Use reference: INV-XXXX", emoji: "🔵", isActive: true },
      { name: "Dutch-Bangla Bank", type: "bank_transfer", category: "bank", accountName: "SOFTWORKS IT FARM LTD", accountNumber: "1051234567890", bankName: "Dutch-Bangla Bank Limited", branchName: "Gulshan Branch", routingNumber: "090262174", instructions: "Transfer to account. Email payment slip to accounts@softworks.io", emoji: "🏦", isActive: true },
      { name: "BRAC Bank", type: "bank_transfer", category: "bank", accountName: "SOFTWORKS IT FARM LTD", accountNumber: "1501234567890", bankName: "BRAC Bank Limited", branchName: "Banani Branch", routingNumber: "060272473", instructions: "Transfer to account. Email payment slip to accounts@softworks.io", emoji: "🏦", isActive: true },
      { name: "PayPal", type: "international", category: "international", accountName: "SOFTWORKS IT FARM", accountNumber: "payments@softworks.io", instructions: "Send to PayPal email. Add 4.4% transaction fee.", emoji: "🌐", isActive: true },
      { name: "Wise (TransferWise)", type: "international", category: "international", accountName: "SOFTWORKS IT FARM", instructions: "Contact us for Wise account details based on your currency.", emoji: "💚", isActive: true },
      { name: "Cryptocurrency", type: "crypto", category: "crypto", accountName: "SOFTWORKS IT FARM", accountNumber: "0x742d35Cc6634C0532925a3b8D4C9E4c7B5F3a2E", instructions: "We accept USDT (TRC20/ERC20), BTC, ETH. Contact us for wallet address.", emoji: "₿", isActive: true },
    ]);
    console.log("  ✔ payment methods seeded");
  } else {
    console.log("  ↩ payment methods already populated — skip");
  }

  // ── Licenses ──────────────────────────────────────────────────────────────
  const existingLicenses = await db.select().from(licensesTable).limit(1);
  if (existingLicenses.length === 0) {
    await db.insert(licensesTable).values([
      { licenseKey: "SWF-PRO-2024-NOVA-001", productName: "TaskFlow Pro", clientName: "Jessica Williams", clientEmail: "jessica@novatech.com", domain: "novatech.com", status: "active", licenseType: "annual", maxDomains: 3, feeAmount: "290", billingCycle: "annual", paymentStatus: "paid", paymentMethodName: "PayPal", lastPaymentDate: "2024-01-15", nextPaymentDue: "2025-01-15", autoBlockEnabled: true, activatedAt: new Date("2024-01-15"), lastValidated: new Date() },
      { licenseKey: "SWF-ENT-2024-FIN-002", productName: "SecureVault", clientName: "David Kim", clientEmail: "david@financeedge.com", domain: "financeedge.com", status: "active", licenseType: "annual", maxDomains: 5, feeAmount: "490", billingCycle: "annual", paymentStatus: "paid", paymentMethodName: "Wise", lastPaymentDate: "2024-02-01", nextPaymentDue: "2025-02-01", autoBlockEnabled: true, activatedAt: new Date("2024-02-01"), lastValidated: new Date() },
      { licenseKey: "SWF-STD-2024-HLT-003", productName: "DataSight", clientName: "Priya Sharma", clientEmail: "priya@healthbridge.com", domain: "healthbridge.com", status: "active", licenseType: "monthly", maxDomains: 1, feeAmount: "79", billingCycle: "monthly", paymentStatus: "paid", paymentMethodName: "bKash", lastPaymentDate: "2025-03-01", nextPaymentDue: "2025-04-01", autoBlockEnabled: true, activatedAt: new Date("2024-03-01"), lastValidated: new Date() },
      { licenseKey: "SWF-LTM-2023-PAY-004", productName: "TaskFlow Pro", clientName: "Carlos Mendez", clientEmail: "carlos@payswift.com", domain: "payswift.com", status: "expired", licenseType: "lifetime", maxDomains: 2, feeAmount: "999", billingCycle: "lifetime", paymentStatus: "paid", paymentMethodName: "PayPal", lastPaymentDate: "2023-06-15", autoBlockEnabled: false, activatedAt: new Date("2023-06-15"), lastValidated: new Date("2024-06-15") },
      { licenseKey: "SWF-TRL-2025-NEW-005", productName: "DataSight", clientName: "Alex Turner", clientEmail: "alex@startup.io", domain: "startup.io", status: "active", licenseType: "trial", maxDomains: 1, feeAmount: "0", billingCycle: "trial", paymentStatus: "free", autoBlockEnabled: true, activatedAt: new Date(), lastValidated: new Date() },
    ]);
    console.log("  ✔ licenses seeded");
  } else {
    console.log("  ↩ licenses already populated — skip");
  }

  console.log("\n✅ Seed complete!");
  await pool.end();
  process.exit(0);
}

seedIfEmpty().catch(async (err) => {
  console.error("❌ Seed failed:", err.message);
  try { await pool.end(); } catch { /* ignore */ }
  process.exit(1);
});
