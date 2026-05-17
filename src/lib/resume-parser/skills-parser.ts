export interface ParsedSkills {
  technical: string[]
  soft: string[]
  tools: string[]
  languages: string[]
  all: string[]
}

const KNOWN_TECH = new Set([
  "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift",
  "kotlin", "scala", "r", "matlab", "sql", "html", "css", "bash", "shell", "powershell",
  "react", "next.js", "vue", "angular", "svelte", "node.js", "express", "fastapi", "django",
  "flask", "spring", "laravel", "rails", "graphql", "rest", "grpc", "websockets",
  "postgresql", "mysql", "mongodb", "redis", "sqlite", "elasticsearch", "cassandra",
  "aws", "gcp", "azure", "vercel", "netlify", "heroku", "docker", "kubernetes", "terraform",
  "ansible", "jenkins", "github actions", "gitlab ci", "circleci",
  "git", "linux", "nginx", "apache", "figma", "sketch", "jira", "confluence",
  "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "spark", "kafka",
  "prisma", "sequelize", "typeorm", "mongoose", "tailwind", "sass", "less",
])

const SOFT_SKILLS = new Set([
  "leadership", "communication", "teamwork", "problem solving", "critical thinking",
  "time management", "creativity", "adaptability", "collaboration", "mentoring",
  "project management", "agile", "scrum", "kanban",
])

const SPOKEN_LANGUAGES = new Set([
  "english", "spanish", "french", "german", "portuguese", "chinese", "mandarin",
  "japanese", "korean", "arabic", "hindi", "italian", "dutch", "russian",
])

function normalizeSkill(s: string): string {
  return s
    .replace(/\s*\(.*?\)/g, "")
    .replace(/[,;|/]+$/, "")
    .trim()
}

export function parseSkills(text: string): ParsedSkills {
  // Split on common delimiters
  const raw = text
    .split(/[,\n|•·;\/]/)
    .map((s) => normalizeSkill(s))
    .filter((s) => s.length > 1 && s.length < 40)

  const technical: string[] = []
  const soft: string[] = []
  const tools: string[] = []
  const languages: string[] = []
  const seen = new Set<string>()

  for (const skill of raw) {
    const lower = skill.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)

    if (SPOKEN_LANGUAGES.has(lower)) {
      languages.push(skill)
    } else if (SOFT_SKILLS.has(lower)) {
      soft.push(skill)
    } else if (KNOWN_TECH.has(lower)) {
      technical.push(skill)
    } else if (skill.length > 1) {
      tools.push(skill)
    }
  }

  return {
    technical,
    soft,
    tools,
    languages,
    all: [...technical, ...soft, ...tools],
  }
}
