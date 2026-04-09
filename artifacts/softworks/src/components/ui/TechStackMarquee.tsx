const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const ROW1_LANGUAGES = [
  { name: "JavaScript", src: `${DEVICON}/javascript/javascript-original.svg`, color: "#F7DF1E" },
  { name: "TypeScript", src: `${DEVICON}/typescript/typescript-original.svg`, color: "#3178C6" },
  { name: "Python", src: `${DEVICON}/python/python-original.svg`, color: "#3776AB" },
  { name: "PHP", src: `${DEVICON}/php/php-original.svg`, color: "#8892BF" },
  { name: "Java", src: `${DEVICON}/java/java-original.svg`, color: "#ED8B00" },
  { name: "C#", src: `${DEVICON}/csharp/csharp-original.svg`, color: "#9B4993" },
  { name: "C++", src: `${DEVICON}/cplusplus/cplusplus-original.svg`, color: "#00599C" },
  { name: "Go", src: `${DEVICON}/go/go-original.svg`, color: "#00ADD8" },
  { name: "Rust", src: `${DEVICON}/rust/rust-original.svg`, color: "#CE412B" },
  { name: "Kotlin", src: `${DEVICON}/kotlin/kotlin-original.svg`, color: "#7F52FF" },
  { name: "Swift", src: `${DEVICON}/swift/swift-original.svg`, color: "#FA7343" },
  { name: "Dart", src: `${DEVICON}/dart/dart-original.svg`, color: "#0175C2" },
  { name: "Ruby", src: `${DEVICON}/ruby/ruby-original.svg`, color: "#CC342D" },
  { name: "Scala", src: `${DEVICON}/scala/scala-original.svg`, color: "#DC322F" },
  { name: "R", src: `${DEVICON}/r/r-original.svg`, color: "#276DC3" },
  { name: "Lua", src: `${DEVICON}/lua/lua-original.svg`, color: "#000080" },
  { name: "Bash", src: `${DEVICON}/bash/bash-original.svg`, color: "#4EAA25" },
  { name: "Perl", src: `${DEVICON}/perl/perl-original.svg`, color: "#39457E" },
];

const ROW2_FRONTEND = [
  { name: "React", src: `${DEVICON}/react/react-original.svg`, color: "#61DAFB" },
  { name: "Next.js", src: `${DEVICON}/nextjs/nextjs-original.svg`, color: "#FFFFFF" },
  { name: "Vue.js", src: `${DEVICON}/vuejs/vuejs-original.svg`, color: "#42B883" },
  { name: "Angular", src: `${DEVICON}/angular/angular-original.svg`, color: "#DD0031" },
  { name: "Svelte", src: `${DEVICON}/svelte/svelte-original.svg`, color: "#FF3E00" },
  { name: "Nuxt", src: `${DEVICON}/nuxtjs/nuxtjs-original.svg`, color: "#00DC82" },
  { name: "Astro", src: `${DEVICON}/astro/astro-original.svg`, color: "#FF5D01" },
  { name: "Tailwind CSS", src: `${DEVICON}/tailwindcss/tailwindcss-original.svg`, color: "#06B6D4" },
  { name: "Bootstrap", src: `${DEVICON}/bootstrap/bootstrap-original.svg`, color: "#7952B3" },
  { name: "Sass", src: `${DEVICON}/sass/sass-original.svg`, color: "#CC6699" },
  { name: "Redux", src: `${DEVICON}/redux/redux-original.svg`, color: "#764ABC" },
  { name: "Three.js", src: `${DEVICON}/threejs/threejs-original.svg`, color: "#FFFFFF" },
  { name: "jQuery", src: `${DEVICON}/jquery/jquery-original.svg`, color: "#0769AD" },
  { name: "Vite", src: `${DEVICON}/vitejs/vitejs-original.svg`, color: "#646CFF" },
  { name: "Webpack", src: `${DEVICON}/webpack/webpack-original.svg`, color: "#8DD6F9" },
  { name: "Flutter", src: `${DEVICON}/flutter/flutter-original.svg`, color: "#02569B" },
  { name: "React Native", src: `${DEVICON}/react/react-original.svg`, color: "#61DAFB" },
  { name: "Ionic", src: `${DEVICON}/ionic/ionic-original.svg`, color: "#3880FF" },
];

const ROW3_BACKEND_CLOUD = [
  { name: "Node.js", src: `${DEVICON}/nodejs/nodejs-original.svg`, color: "#339933" },
  { name: "Express", src: `${DEVICON}/express/express-original.svg`, color: "#FFFFFF" },
  { name: "NestJS", src: `${DEVICON}/nestjs/nestjs-original.svg`, color: "#E0234E" },
  { name: "Django", src: `${DEVICON}/django/django-plain.svg`, color: "#092E20" },
  { name: "FastAPI", src: `${DEVICON}/fastapi/fastapi-original.svg`, color: "#009688" },
  { name: "Laravel", src: `${DEVICON}/laravel/laravel-original.svg`, color: "#FF2D20" },
  { name: "Spring", src: `${DEVICON}/spring/spring-original.svg`, color: "#6DB33F" },
  { name: ".NET", src: `${DEVICON}/dotnetcore/dotnetcore-original.svg`, color: "#512BD4" },
  { name: "Flask", src: `${DEVICON}/flask/flask-original.svg`, color: "#FFFFFF" },
  { name: "GraphQL", src: `${DEVICON}/graphql/graphql-plain.svg`, color: "#E10098" },
  { name: "PostgreSQL", src: `${DEVICON}/postgresql/postgresql-original.svg`, color: "#336791" },
  { name: "MySQL", src: `${DEVICON}/mysql/mysql-original.svg`, color: "#4479A1" },
  { name: "MongoDB", src: `${DEVICON}/mongodb/mongodb-original.svg`, color: "#47A248" },
  { name: "Redis", src: `${DEVICON}/redis/redis-original.svg`, color: "#DC382D" },
  { name: "Firebase", src: `${DEVICON}/firebase/firebase-original.svg`, color: "#FFCA28" },
  { name: "Docker", src: `${DEVICON}/docker/docker-original.svg`, color: "#2496ED" },
  { name: "Kubernetes", src: `${DEVICON}/kubernetes/kubernetes-original.svg`, color: "#326CE5" },
  { name: "AWS", src: `${DEVICON}/amazonwebservices/amazonwebservices-original-wordmark.svg`, color: "#FF9900" },
  { name: "GCP", src: `${DEVICON}/googlecloud/googlecloud-original.svg`, color: "#4285F4" },
  { name: "Azure", src: `${DEVICON}/azure/azure-original.svg`, color: "#0078D4" },
  { name: "Linux", src: `${DEVICON}/linux/linux-original.svg`, color: "#FCC624" },
  { name: "Git", src: `${DEVICON}/git/git-original.svg`, color: "#F05032" },
  { name: "GitHub", src: `${DEVICON}/github/github-original.svg`, color: "#FFFFFF" },
  { name: "Nginx", src: `${DEVICON}/nginx/nginx-original.svg`, color: "#009639" },
];

interface TechItem {
  name: string;
  src: string;
  color: string;
}

function MarqueeRow({ items, direction = "left", speed = 40 }: { items: TechItem[]; direction?: "left" | "right"; speed?: number }) {
  const doubled = [...items, ...items];
  const animClass = direction === "left" ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="relative overflow-hidden py-1" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
      <div
        className={`flex gap-3 sm:gap-4 w-max ${animClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((tech, i) => (
          <div
            key={`${tech.name}-${i}`}
            className="flex flex-col items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/20 transition-all duration-300 group cursor-default min-w-[70px] sm:min-w-[80px]"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px 2px ${tech.color}25`;
              (e.currentTarget as HTMLDivElement).style.borderColor = `${tech.color}40`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              (e.currentTarget as HTMLDivElement).style.borderColor = "";
            }}
          >
            <img
              src={tech.src}
              alt={tech.name}
              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap font-medium">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TechStackMarquee() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-8 sm:mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Tech Stack
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
          Every Language. Every{" "}
          <span className="gradient-text">Framework.</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          From systems-level C++ to modern TypeScript — we build with whatever your project demands.
        </p>
      </div>

      <div className="space-y-4">
        <MarqueeRow items={ROW1_LANGUAGES} direction="left" speed={50} />
        <MarqueeRow items={ROW2_FRONTEND} direction="right" speed={45} />
        <MarqueeRow items={ROW3_BACKEND_CLOUD} direction="left" speed={55} />
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10 text-center">
        <p className="text-xs text-muted-foreground/50 font-mono">
          50+ technologies · Fullstack · Mobile · DevOps · AI/ML · Cloud
        </p>
      </div>
    </section>
  );
}
