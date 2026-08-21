import re
import logging
from urllib.parse import urlparse
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Fallback high-quality curated technical documentation and learning resources dictionary
CURATED_RESOURCE_DATABASE: Dict[str, List[Dict[str, Any]]] = {
    "django": [
        {
            "title": "Official Django Documentation & Tutorials",
            "provider": "Django Software Foundation",
            "url": "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Beginner",
            "why_recommended": "The definitive, comprehensive starting point for learning Django straight from core maintainers."
        },
        {
            "title": "Django REST Framework — Official Quickstart",
            "provider": "Django REST Framework",
            "url": "https://www.django-rest-framework.org/tutorial/quickstart/",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "Official step-by-step guide to building production-ready RESTful APIs in Django."
        },
        {
            "title": "LearnDjango.com Tutorials & Best Practices",
            "provider": "LearnDjango",
            "url": "https://learndjango.com/tutorials/",
            "resource_type": "tutorial",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "Clear, practical guides covering authentication, deployment, and Django project structure."
        },
        {
            "title": "Django REST API CRUD with DRF",
            "provider": "GeeksforGeeks",
            "url": "https://www.geeksforgeeks.org/python/django-rest-api-crud-with-drf/",
            "resource_type": "tutorial",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "Handy code snippets for implementing model serializers and class-based views."
        }
    ],
    "react": [
        {
            "title": "React Official Documentation — Learn React",
            "provider": "React Core Team",
            "url": "https://react.dev/learn",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Beginner",
            "why_recommended": "Interactive, state-of-the-art guide to modern React with Server Components and Hooks."
        },
        {
            "title": "React Performance Optimization Guide",
            "provider": "React Docs",
            "url": "https://react.dev/learn/render-and-commit",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Advanced",
            "why_recommended": "Deep dive into React rendering pipeline, re-render triggers, and memoization techniques."
        }
    ],
    "python": [
        {
            "title": "Python Official Tutorial",
            "provider": "Python Software Foundation",
            "url": "https://docs.python.org/3/tutorial/",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Beginner",
            "why_recommended": "Official Python core documentation covering syntax, data structures, and standard library."
        },
        {
            "title": "Real Python Tutorials & Guides",
            "provider": "Real Python",
            "url": "https://realpython.com/",
            "resource_type": "tutorial",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "In-depth, Pythonic articles and project walkthroughs."
        }
    ],
    "docker": [
        {
            "title": "Docker Official Orientation & Guide",
            "provider": "Docker Inc.",
            "url": "https://docs.docker.com/get-started/",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Beginner",
            "why_recommended": "Official step-by-step introduction to containerizing applications and Docker Compose."
        }
    ],
    "kubernetes": [
        {
            "title": "Kubernetes Basics & Architecture",
            "provider": "Kubernetes.io",
            "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
            "resource_type": "documentation",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "Interactive hands-on tutorials for deploying, scaling, and managing cluster workloads."
        }
    ],
    "aws": [
        {
            "title": "AWS Skill Builder & Cloud Practitioner Essentials",
            "provider": "Amazon Web Services",
            "url": "https://aws.amazon.com/training/",
            "resource_type": "course",
            "is_free": True,
            "difficulty": "Intermediate",
            "why_recommended": "Official AWS cloud training courses and architecture fundamentals."
        }
    ]
}


def infer_provider_from_url(url: str) -> str:
    """Extract human-readable provider name from URL host."""
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    if 'youtube.com' in domain or 'youtu.be' in domain:
        return 'YouTube'
    if 'udemy.com' in domain:
        return 'Udemy'
    if 'coursera.org' in domain:
        return 'Coursera'
    if 'freecodecamp.org' in domain:
        return 'freeCodeCamp'
    if 'developer.mozilla.org' in domain:
        return 'MDN Web Docs'
    if 'docs.djangoproject.com' in domain or 'django-rest-framework.org' in domain:
        return 'Django Official Docs'
    if 'react.dev' in domain:
        return 'React Official Docs'
    if 'geeksforgeeks.org' in domain:
        return 'GeeksforGeeks'
    if 'realpython.com' in domain:
        return 'Real Python'
    if 'medium.com' in domain or 'dev.to' in domain:
        return 'Developer Community'
    if 'docs.docker.com' in domain:
        return 'Docker Docs'
    if 'aws.amazon.com' in domain:
        return 'AWS Official'
    if 'learn.microsoft.com' in domain:
        return 'Microsoft Learn'

    # Strip www and tld
    clean_domain = re.sub(r'^www\.', '', domain)
    parts = clean_domain.split('.')
    if len(parts) >= 2:
        return parts[0].capitalize()
    return domain


def infer_resource_type(url: str, title: str) -> str:
    """Infer resource classification type."""
    text = (url + ' ' + title).lower()
    if 'youtube.com' in text or 'video' in text or 'playlist' in text:
        return 'video'
    if 'docs' in text or 'documentation' in text or 'quickstart' in text:
        return 'documentation'
    if 'udemy.com' in text or 'coursera' in text or 'course' in text:
        return 'course'
    if 'book' in text:
        return 'book'
    if 'tutorial' in text or 'guide' in text:
        return 'tutorial'
    if 'github.com' in text or 'project' in text:
        return 'project'
    return 'article'


def search_learning_resources(query: str, topic_name: str = "", max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Executes real DuckDuckGo web search retrieval for technical learning resources.
    Returns verified URLs, titles, domain providers, and snippets.
    Falls back to curated resource dictionary if search engine returns empty or fails.
    """
    discovered_resources: List[Dict[str, Any]] = []

    # 1. Try DDGS live web search
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            for item in results:
                url = item.get('href') or item.get('link') or ''
                title = item.get('title') or ''
                snippet = item.get('body') or item.get('snippet') or ''
                if url and title and url.startswith('http'):
                    provider = infer_provider_from_url(url)
                    r_type = infer_resource_type(url, title)
                    is_free = not any(paid_domain in url.lower() for paid_domain in ['udemy.com', 'pluralsight.com', 'scrimba.com'])
                    discovered_resources.append({
                        "title": title.strip(),
                        "provider": provider,
                        "url": url.strip(),
                        "snippet": snippet.strip(),
                        "resource_type": r_type,
                        "is_free": is_free,
                        "difficulty": "Intermediate",
                        "why_recommended": snippet[:180] + "..." if len(snippet) > 180 else snippet
                    })
    except Exception as e:
        logger.warning(f"DuckDuckGo search failed for query '{query}': {e}")

    # 2. If DDGS returned fewer than 3 results, run secondary query search for topic
    if len(discovered_resources) < 3 and topic_name:
        try:
            from ddgs import DDGS
            with DDGS() as ddgs:
                sec_query = f"{topic_name} tutorial documentation course site:youtube.com OR site:udemy.com OR site:github.com"
                sec_results = list(ddgs.text(sec_query, max_results=5))
                existing_urls = {r['url'] for r in discovered_resources}
                for item in sec_results:
                    url = item.get('href') or ''
                    title = item.get('title') or ''
                    snippet = item.get('body') or ''
                    if url and title and url.startswith('http') and url not in existing_urls:
                        provider = infer_provider_from_url(url)
                        r_type = infer_resource_type(url, title)
                        is_free = not ('udemy.com' in url.lower() or 'pluralsight.com' in url.lower())
                        discovered_resources.append({
                            "title": title.strip(),
                            "provider": provider,
                            "url": url.strip(),
                            "snippet": snippet.strip(),
                            "resource_type": r_type,
                            "is_free": is_free,
                            "difficulty": "Intermediate",
                            "why_recommended": snippet[:180] + "..." if len(snippet) > 180 else snippet
                        })
        except Exception as e:
            logger.warning(f"Secondary search failed: {e}")

    # 3. If live search returned empty, retrieve from curated database fallback
    if not discovered_resources:
        topic_lower = topic_name.lower() or query.lower()
        for key, curated_list in CURATED_RESOURCE_DATABASE.items():
            if key in topic_lower or topic_lower in key:
                for item in curated_list:
                    discovered_resources.append(dict(item))
                break

    # 4. Global generic fallback if still empty
    if not discovered_resources:
        clean_topic = topic_name or query
        discovered_resources = [
            {
                "title": f"Official Documentation & Guides for {clean_topic}",
                "provider": "Official Docs / Community",
                "url": f"https://www.google.com/search?q={clean_topic.replace(' ', '+')}+documentation",
                "snippet": f"Official guides, tutorials, and references to master {clean_topic}.",
                "resource_type": "documentation",
                "is_free": True,
                "difficulty": "Intermediate",
                "why_recommended": f"Essential reference guide for {clean_topic} concepts."
            },
            {
                "title": f"YouTube — {clean_topic} Full Course Walkthrough",
                "provider": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={clean_topic.replace(' ', '+')}+full+course",
                "snippet": f"Comprehensive free video tutorials and practical coding projects for {clean_topic}.",
                "resource_type": "video",
                "is_free": True,
                "difficulty": "Intermediate",
                "why_recommended": f"In-depth video playlist covering real-world {clean_topic} development."
            }
        ]

    return discovered_resources
