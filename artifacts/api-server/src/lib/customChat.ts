/**
 * SOFTWORKS IT FARM — Custom AI Chat Engine
 * No third-party AI APIs required. Fully self-hosted.
 */

interface Intent {
  name: string;
  patterns: RegExp[];
  responses: string[];
}

const COMPANY_INFO = {
  name: "SOFTWORKS IT FARM",
  tagline: "Premium IT Consulting & Software Development",
  founded: "2019",
  clients: "65+",
  projects: "123+",
  teamSize: "12+",
  email: "hello@softworks.dev",
  location: "Dhaka, Bangladesh (Remote-first, Global)",
  services: ["Custom Web Development", "Mobile App Development", "AI & ML Integration", "SaaS Platforms", "Cloud Infrastructure", "IT Consulting", "UI/UX Design", "E-Commerce Solutions"],
  technologies: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Flutter", "React Native", "Docker", "AWS", "PostgreSQL", "MongoDB"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INTENTS: Intent[] = [
  {
    name: "greeting",
    patterns: [/\b(hi|hello|hey|salam|assalamu|good morning|good afternoon|good evening|হ্যালো|হেলো|নমস্কার)\b/i],
    responses: [
      `Hello! 👋 Welcome to **${COMPANY_INFO.name}**. I'm your virtual assistant. How can I help you today?`,
      `Hi there! 😊 Thanks for reaching out to **${COMPANY_INFO.name}**. I'm here to help. What are you looking for?`,
      `Assalamu Alaikum! Welcome to **${COMPANY_INFO.name}** — your trusted IT partner. What can I do for you?`,
    ],
  },
  {
    name: "services",
    patterns: [/\b(service|services|কাজ|কী করো|what do you do|what you do|offer|offering|করতে পারো|আপনারা কি করেন)\b/i],
    responses: [
      `**${COMPANY_INFO.name}** offers a wide range of IT services:\n\n• 🌐 **Custom Web Development** (React, Next.js, Node.js)\n• 📱 **Mobile Apps** (Flutter, React Native)\n• 🤖 **AI & ML Integration**\n• ☁️ **SaaS Platform Development**\n• 🛒 **E-Commerce Solutions**\n• 🏗️ **Cloud Infrastructure** (AWS, Docker)\n• 🎨 **UI/UX Design**\n• 💼 **IT Consulting**\n\nWhich service interests you most?`,
      `We specialize in **${COMPANY_INFO.services.join(", ")}**.\n\nWith ${COMPANY_INFO.projects} projects delivered and ${COMPANY_INFO.clients} happy clients, we bring expertise to every project. What are you looking to build?`,
    ],
  },
  {
    name: "web_development",
    patterns: [/\b(web|website|web app|web application|react|next\.?js|node|backend|frontend|full.?stack|ওয়েবসাইট|ওয়েব)\b/i],
    responses: [
      `We build **modern, high-performance web applications** using:\n\n• **Frontend**: React, Next.js, TypeScript, Tailwind CSS\n• **Backend**: Node.js, Express, FastAPI (Python)\n• **Database**: PostgreSQL, MongoDB, Redis\n• **Hosting**: AWS, Vercel, Railway\n\nOur web apps are scalable, SEO-friendly, and built with best practices. Want a custom quote?`,
      `**Web Development** is our core strength! We've delivered ${COMPANY_INFO.projects} web projects ranging from simple business sites to complex SaaS platforms.\n\n💡 **Tech Stack**: React/Next.js + Node.js/TypeScript + PostgreSQL\n⚡ **Delivery**: 2-12 weeks depending on scope\n✅ **Support**: 3 months free support after launch\n\nShare your idea and we'll plan it together!`,
    ],
  },
  {
    name: "mobile_development",
    patterns: [/\b(mobile|app|android|ios|flutter|react native|phone app|মোবাইল|অ্যাপ)\b/i],
    responses: [
      `We develop **cross-platform mobile apps** that work on both Android & iOS:\n\n• **Flutter** — Beautiful, native-like performance\n• **React Native** — Code sharing with web\n• **Features**: Offline support, push notifications, payments, camera, GPS\n• **Publish**: We handle App Store & Play Store submission\n\nStarting from a small MVP to a full-featured app — we've got you covered!`,
      `Our mobile team specializes in **Flutter & React Native** development.\n\n📱 Build once, run on Android + iOS\n⚡ Fast performance, native look & feel\n🔒 Secure authentication & data storage\n💳 Payment gateway integration\n🚀 App Store & Play Store publishing\n\nHow complex is the app you have in mind?`,
    ],
  },
  {
    name: "ecommerce",
    patterns: [/\b(e.?commerce|ecommerce|shop|store|woocommerce|shopify|product|sell|order|ই-কমার্স|অনলাইন শপ|দোকান)\b/i],
    responses: [
      `We build **powerful e-commerce solutions** tailored to your business:\n\n🛒 **Custom Online Store** — Built from scratch, no limitations\n🔧 **WooCommerce** — WordPress-based, easy to manage\n📦 **Inventory Management** — Real-time stock tracking\n💳 **Payment Gateways** — bKash, Nagad, SSLCommerz, Stripe\n📊 **Analytics Dashboard** — Sales, revenue, customer insights\n🚚 **Delivery Integration** — Courier management\n\nWe've built stores doing thousands of orders daily. Want a demo?`,
      `E-Commerce is booming in Bangladesh! We help businesses go online with:\n\n• Custom product catalog & search\n• Bangladesh payment gateways (bKash, Nagad, SSLCommerz)\n• Order management system\n• SMS/email notifications\n• Mobile-responsive design\n• Admin panel for easy management\n\nWhat kind of products are you selling?`,
    ],
  },
  {
    name: "ai_ml",
    patterns: [/\b(ai|artificial intelligence|machine learning|ml|chatbot|automation|automate|আর্টিফিশিয়াল|মেশিন লার্নিং)\b/i],
    responses: [
      `We build **custom AI & ML solutions** — not just connecting to ChatGPT!\n\n🤖 **Custom Chatbots** — Trained on YOUR data\n📊 **Data Analysis & Prediction** — Business intelligence\n🔤 **NLP Solutions** — Bengali & English text processing\n👁️ **Computer Vision** — Image recognition, OCR\n🔄 **Process Automation** — Reduce manual work by 80%\n📈 **Recommendation Systems** — Like what Netflix does\n\nAll solutions are self-hosted — your data stays private!`,
      `Our AI team builds **practical, self-hosted AI systems**:\n\n• Custom knowledge base chatbots (no OpenAI needed!)\n• Document processing & extraction\n• Sales forecasting & analytics\n• Customer behavior analysis\n• Automated report generation\n• Bengali language processing\n\nWe believe in AI that YOU control, not dependent on expensive API subscriptions. Interested?`,
    ],
  },
  {
    name: "saas",
    patterns: [/\b(saas|software as a service|subscription|platform|multi.?tenant|সাস|প্ল্যাটফর্ম)\b/i],
    responses: [
      `**SaaS Platform Development** is one of our specialties!\n\n🏗️ **Multi-tenant Architecture** — One codebase, many clients\n💳 **Subscription Billing** — Stripe, local payment gateways\n📊 **Admin Dashboard** — Manage users, plans, revenue\n🔐 **Role-based Access** — Fine-grained permissions\n📈 **Analytics** — MRR, churn, user metrics\n🚀 **Scalable** — Built to grow from 10 to 10,000 users\n\nWe've built SaaS products from zero to paying customers. What's your idea?`,
    ],
  },
  {
    name: "pricing",
    patterns: [/\b(price|pricing|cost|কত|budget|charge|rate|fee|payment|দাম|মূল্য|খরচ|কত টাকা|how much)\b/i],
    responses: [
      `Our pricing depends on project scope and complexity:\n\n💼 **Small Projects** (landing page, simple site): ৳15,000–৳50,000\n🌐 **Medium Projects** (web app, e-commerce): ৳50,000–৳2,00,000\n🏗️ **Large Projects** (SaaS, complex systems): ৳2,00,000+\n📱 **Mobile Apps**: ৳80,000–৳3,00,000\n\n⚡ We offer **flexible payment plans** — 40% upfront, rest on milestones.\n\nFor an accurate quote, share your project requirements and we'll get back within 24 hours!`,
      `We offer **competitive, transparent pricing**:\n\n• Fixed-price projects (you know the cost upfront)\n• Hourly consulting (for ongoing work)\n• Monthly retainer (for continuous support)\n\n📧 Email **${COMPANY_INFO.email}** with your requirements for a custom quote within 24 hours!\n\nWe believe quality work should be fairly priced — no hidden costs.`,
    ],
  },
  {
    name: "portfolio",
    patterns: [/\b(portfolio|project|work|sample|example|previous|আগের কাজ|কাজের নমুনা|কাজ দেখান)\b/i],
    responses: [
      `We've delivered **${COMPANY_INFO.projects} projects** across various industries:\n\n🛒 **E-Commerce**: Multi-vendor marketplaces, brand stores\n🏥 **Healthcare**: Patient management, telemedicine apps\n🎓 **Education**: LMS, online course platforms\n🏦 **Finance**: Accounting software, invoice management\n🏭 **Enterprise**: ERP systems, workflow automation\n📱 **Mobile**: B2B and B2C applications\n\nVisit our **Portfolio** section on the website to see live projects! Or ask me about a specific industry.`,
    ],
  },
  {
    name: "team",
    patterns: [/\b(team|about|company|who are you|developer|staff|employee|আপনারা কারা|টিম)\b/i],
    responses: [
      `**${COMPANY_INFO.name}** is a premium IT firm founded in ${COMPANY_INFO.founded}.\n\n👥 **Team**: ${COMPANY_INFO.teamSize} specialists\n📍 **Location**: ${COMPANY_INFO.location}\n🏆 **Track Record**: ${COMPANY_INFO.projects} projects, ${COMPANY_INFO.clients} clients\n\n**Our Experts**:\n• Senior Full-Stack Developers\n• Mobile App Specialists\n• UI/UX Designers\n• DevOps Engineers\n• AI/ML Engineers\n• Project Managers\n\nWe are passionate about delivering quality software that makes a real impact!`,
    ],
  },
  {
    name: "contact",
    patterns: [/\b(contact|reach|email|phone|call|whatsapp|যোগাযোগ|ইমেইল|ফোন|কথা বলতে চাই|কীভাবে যোগাযোগ)\b/i],
    responses: [
      `You can reach **${COMPANY_INFO.name}** through:\n\n📧 **Email**: ${COMPANY_INFO.email}\n💬 **Use our Contact Form** on the website\n📍 **Location**: ${COMPANY_INFO.location}\n\n⏰ **Response Time**: Within 2-4 business hours\n🕐 **Working Hours**: Sunday–Thursday, 9 AM–7 PM (BST)\n\nFor urgent matters, email us and mention URGENT in the subject!`,
      `Reach us at **${COMPANY_INFO.email}** — we respond within a few hours!\n\nOr fill out the **Contact Form** on our website and tell us about your project. We'll set up a free 30-minute consultation call to discuss your requirements.`,
    ],
  },
  {
    name: "timeline",
    patterns: [/\b(how long|timeline|duration|deadline|delivery|time|week|month|কতদিন|কত সময়|সময়কাল)\b/i],
    responses: [
      `Project timelines depend on scope:\n\n⚡ **Landing Page / Brochure Site**: 1–2 weeks\n🌐 **Business Web App**: 4–8 weeks\n🛒 **E-Commerce Store**: 6–10 weeks\n📱 **Mobile App (MVP)**: 6–12 weeks\n🏗️ **Full SaaS Platform**: 3–6 months\n\nWe use **agile methodology** — you see progress every week, not just at the end!\n\nWant a specific timeline estimate for your project?`,
    ],
  },
  {
    name: "process",
    patterns: [/\b(process|how does it work|how to start|get started|steps|methodology|কীভাবে শুরু|প্রক্রিয়া)\b/i],
    responses: [
      `Our proven development process:\n\n1️⃣ **Discovery** — Free consultation, understand your goals\n2️⃣ **Planning** — Scope, timeline, cost estimate (2–3 days)\n3️⃣ **Design** — UI/UX wireframes, you approve before coding\n4️⃣ **Development** — Agile sprints, weekly demos\n5️⃣ **Testing** — QA, bug fixes, performance optimization\n6️⃣ **Launch** — Deployment, go-live support\n7️⃣ **Support** — 3 months free post-launch support\n\n**Start today**: Email **${COMPANY_INFO.email}** with your project idea!`,
    ],
  },
  {
    name: "support",
    patterns: [/\b(support|maintenance|bug|issue|problem|help|সমস্যা|সাপোর্ট|রক্ষণাবেক্ষণ)\b/i],
    responses: [
      `We provide **comprehensive post-launch support**:\n\n✅ **Free 3-month** bug fixing & support after delivery\n🔧 **Monthly Maintenance** plans available\n⚡ **Priority Support** for urgent issues\n📊 **Performance Monitoring** & optimization\n🔒 **Security Updates** to keep your app safe\n\nYou won't be left alone after launch — we're here for the long run! What issue can I help with?`,
    ],
  },
  {
    name: "technology",
    patterns: [/\b(technology|tech|stack|language|framework|react|node|python|flutter|database|sql|খুটিনাটি|প্রযুক্তি)\b/i],
    responses: [
      `Our **technology expertise**:\n\n**Frontend**: React, Next.js, Vue.js, TypeScript, Tailwind CSS\n**Backend**: Node.js, Express, Python (FastAPI/Django), PHP (Laravel)\n**Mobile**: Flutter, React Native\n**Database**: PostgreSQL, MySQL, MongoDB, Redis\n**Cloud**: AWS, Google Cloud, Vercel, Railway\n**DevOps**: Docker, GitHub Actions, CI/CD\n**AI/ML**: Python, TensorFlow, PyTorch, Langchain\n\nWe pick the **best tool for your use case** — not just what's trendy!`,
    ],
  },
  {
    name: "hosting",
    patterns: [/\b(hosting|deploy|server|cloud|vps|domain|হোস্টিং|সার্ভার)\b/i],
    responses: [
      `We handle the complete **hosting & deployment setup**:\n\n☁️ **Cloud Providers**: AWS, Google Cloud, DigitalOcean, Hetzner\n🚀 **Managed Platforms**: Vercel, Railway, Render (easy & cost-effective)\n🔒 **SSL Certificate**: Free with every deployment\n📊 **CDN**: Fast loading worldwide\n🔄 **Auto-backup**: Daily database backups\n\n**Bangladesh-friendly hosting** options available for local performance! We set everything up and hand it over to you.`,
    ],
  },
  {
    name: "payment_gateway",
    patterns: [/\b(payment|bkash|nagad|sslcommerz|stripe|gateway|পেমেন্ট|বিকাশ|নগদ)\b/i],
    responses: [
      `We integrate **all major payment gateways** including:\n\n🇧🇩 **Bangladesh**: bKash, Nagad, Rocket, SSLCommerz, AamarPay, ShurjoPay\n🌍 **International**: Stripe, PayPal, Razorpay\n💳 **Cards**: Visa, Mastercard, Amex\n\nAll integrations come with:\n✅ Secure transaction processing\n✅ Refund management\n✅ Transaction history & reports\n✅ PCI DSS compliance\n\nWhich payment methods do you need?`,
    ],
  },
  {
    name: "thanks",
    patterns: [/\b(thanks|thank you|ধন্যবাদ|শুক্রিয়া|জাযাকাল্লাহ|great|awesome|perfect|excellent)\b/i],
    responses: [
      `You're welcome! 😊 It's our pleasure to help. Feel free to ask anything else or contact us at **${COMPANY_INFO.email}** to start your project. Have a great day!`,
      `Thank you for your kind words! 🙏 If you have any more questions or are ready to start, reach out to us at **${COMPANY_INFO.email}**. We'd love to work with you!`,
      `Glad I could help! 😊 Don't hesitate to reach out if you need anything else. We're always here to assist!`,
    ],
  },
  {
    name: "goodbye",
    patterns: [/\b(bye|goodbye|see you|later|আল্লাহ হাফেজ|খুদা হাফেজ|বিদায়|ধন্যবাদ বিদায়)\b/i],
    responses: [
      `Goodbye! 👋 It was great chatting with you. Don't forget, **${COMPANY_INFO.name}** is just an email away: **${COMPANY_INFO.email}**. Take care!`,
      `See you! 😊 Feel free to come back anytime. We're always happy to help you build something amazing!`,
    ],
  },
];

const FALLBACK_RESPONSES = [
  `That's a great question! I'm best suited to answer questions about **${COMPANY_INFO.name}**'s services, pricing, and capabilities. Could you rephrase your question?\n\nOr feel free to reach us directly at **${COMPANY_INFO.email}** for personalized answers.`,
  `I don't have a specific answer for that, but I'd love to help! Try asking about:\n\n• Our **services** (web, mobile, AI, e-commerce)\n• **Pricing** & timelines\n• **Technologies** we use\n• How to **get started**\n\nOr email us at **${COMPANY_INFO.email}**!`,
  `Interesting question! For the most accurate answer, please reach out to our team at **${COMPANY_INFO.email}** — they'll respond within a few hours.\n\nIs there anything about our **services, pricing, or process** I can help with?`,
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function detectIntent(text: string): Intent | null {
  const lower = text.toLowerCase();
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      if (pattern.test(lower)) {
        return intent;
      }
    }
  }
  return null;
}

function buildContextAwareResponse(message: string, history: ChatMessage[]): string {
  const intent = detectIntent(message);
  if (intent) {
    return pick(intent.responses);
  }

  const lastAssistantMsg = history.filter(m => m.role === "assistant").slice(-1)[0];
  if (lastAssistantMsg?.content.includes("service")) {
    if (/\b(web|website|mobile|app|ai|ecommerce|saas)\b/i.test(message)) {
      return pick(INTENTS.find(i => i.name === "services")!.responses);
    }
  }

  if (/\b(যা|নিয়ে|বলুন|জানতে চাই|কি|কী|কীভাবে|কোথায়|কখন)\b/i.test(message)) {
    return `আমি আপনাকে **${COMPANY_INFO.name}** সম্পর্কে সাহায্য করতে পারব! আমাদের services, pricing, বা কাজের process সম্পর্কে জানতে চান?\n\nঅথবা সরাসরি যোগাযোগ করুন: **${COMPANY_INFO.email}**`;
  }

  return pick(FALLBACK_RESPONSES);
}

export function generateResponse(
  userMessage: string,
  history: ChatMessage[],
): string {
  const text = userMessage.trim();
  if (!text) return "Please ask me something! I'm here to help. 😊";
  return buildContextAwareResponse(text, history);
}

export function* streamResponse(text: string): Generator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";
  }
}
