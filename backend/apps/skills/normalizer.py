import re
from typing import List, Dict, Optional

# Default extensible alias dictionary (lowercased key -> Canonical Display Name)
BUILTIN_SKILL_ALIASES: Dict[str, str] = {
    # Frontend
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angularjs": "Angular",
    "angular.js": "Angular",
    "angular": "Angular",
    "next": "Next.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "nuxt": "Nuxt.js",
    "nuxtjs": "Nuxt.js",
    "nuxt.js": "Nuxt.js",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "typescript.js": "TypeScript",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "javascript.js": "JavaScript",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "bootstrap5": "Bootstrap",
    "redux": "Redux",
    "redux toolkit": "Redux",
    "rtk": "Redux",

    # Backend
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "nest": "NestJS",
    "nestjs": "NestJS",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "django": "Django",
    "django rest framework": "Django REST Framework",
    "drf": "Django REST Framework",
    "fastapi": "FastAPI",
    "go": "Go",
    "golang": "Go",
    "go lang": "Go",
    "java": "Java",
    "c#": "C#",
    "csharp": "C#",
    ".net": ".NET",
    "dotnet": ".NET",

    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "postgresql db": "PostgreSQL",
    "postgres db": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "redis db": "Redis",
    "mysql": "MySQL",
    "mysql db": "MySQL",
    "sqlite": "SQLite",
    "sqlite3": "SQLite",

    # DevOps & Cloud
    "docker": "Docker",
    "docker engine": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "kube": "Kubernetes",
    "git": "Git",
    "github": "Git",
    "aws": "AWS",
    "aws cloud": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud Platform",
    "google cloud": "Google Cloud Platform",
    "google cloud platform": "Google Cloud Platform",
    "azure": "Azure",
    "azure cloud": "Azure",
    "microsoft azure": "Azure",

    # Architecture & Tools
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "graphql": "GraphQL",
    "graphql api": "GraphQL",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
}

# Category auto-inference mapping (lowercased canonical name -> category string)
CATEGORY_INFERENCE_MAP: Dict[str, str] = {
    "react": "frontend",
    "vue.js": "frontend",
    "angular": "frontend",
    "next.js": "frontend",
    "nuxt.js": "frontend",
    "typescript": "frontend",
    "javascript": "frontend",
    "html5": "frontend",
    "css3": "frontend",
    "tailwind css": "frontend",
    "bootstrap": "frontend",
    "redux": "frontend",

    "node.js": "backend",
    "express.js": "backend",
    "nestjs": "backend",
    "python": "backend",
    "django": "backend",
    "django rest framework": "backend",
    "fastapi": "backend",
    "go": "backend",
    "java": "backend",
    "c#": "backend",
    ".net": "backend",

    "postgresql": "database",
    "mongodb": "database",
    "redis": "database",
    "mysql": "database",
    "sqlite": "database",

    "docker": "devops",
    "kubernetes": "devops",
    "ci/cd": "devops",
    "git": "tools",
    "aws": "cloud",
    "google cloud platform": "cloud",
    "azure": "cloud",
}

def normalize_skill_name(raw_name: str) -> str:
    """
    Normalizes raw skill string to canonical form.
    E.g. 'react.js' -> 'React', 'postgres' -> 'PostgreSQL'.
    """
    if not raw_name:
        return ""

    cleaned = raw_name.strip()
    lookup_key = cleaned.lower()

    # Check built-in dictionary
    if lookup_key in BUILTIN_SKILL_ALIASES:
        return BUILTIN_SKILL_ALIASES[lookup_key]

    # Check database aliases if model is accessible
    try:
        from .models import SkillAlias
        alias_obj = SkillAlias.objects.filter(alias__iexact=cleaned).first()
        if alias_obj:
            return alias_obj.canonical_name
    except Exception:
        pass

    # Title-case fallback if no match found
    # Preserve acronyms like AWS, API, SQL, ML, AI
    words = cleaned.split()
    normalized_words = []
    for word in words:
        if word.upper() in ["AWS", "API", "APIS", "SQL", "CSS", "HTML", "REST", "SDK", "UI", "UX", "ML", "AI", "CI/CD"]:
            normalized_words.append(word.upper())
        else:
            normalized_words.append(word.capitalize())

    return " ".join(normalized_words)


def infer_skill_category(skill_name: str) -> str:
    """
    Infers the skill category ('frontend', 'backend', 'database', etc.) based on skill name.
    """
    canonical = normalize_skill_name(skill_name)
    return CATEGORY_INFERENCE_MAP.get(canonical.lower(), "other")


def normalize_skill_list(skills: List[str]) -> List[str]:
    """
    Normalizes a list of skill strings and removes duplicates.
    """
    normalized_set = set()
    for s in skills:
        norm = normalize_skill_name(s)
        if norm:
            normalized_set.add(norm)
    return sorted(list(normalized_set))
