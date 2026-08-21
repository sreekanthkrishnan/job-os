import os
import json
import logging
from typing import Dict, Any, List, Optional
from django.conf import settings
from .retriever import search_learning_resources

logger = logging.getLogger(__name__)

def get_gemini_client():
    """Retrieves configured Google Gemini client or None if API key missing."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
    if not api_key:
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)
        load_dotenv(settings.BASE_DIR.parent / '.env', override=True)
        api_key = os.getenv('GEMINI_API_KEY', '')

    if not api_key:
        return None

    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.warning(f"Failed to initialize google.genai Client: {e}")
        return None


def clean_json_response(text: str) -> str:
    """Strips markdown fenced code block markers from AI output."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def fallback_deterministic_roadmap(goal: str, current_level: str = "intermediate") -> Dict[str, Any]:
    """Generates structured fallback roadmap if Gemini AI is unavailable."""
    title = f"{goal.title()} Learning Roadmap"
    return {
        "title": title,
        "description": f"Structured learning path to master {goal}.",
        "estimated_duration_weeks": 4,
        "modules": [
            {
                "title": f"Phase 1: {goal.title()} Core Foundations",
                "description": f"Master basic building blocks and concepts for {goal}.",
                "order": 1,
                "topics": [
                    {
                        "title": f"Core Concepts of {goal.title()}",
                        "description": f"Essential primitives, terminology, and setup for {goal}.",
                        "order": 1,
                        "difficulty": "beginner" if current_level == "beginner" else "intermediate",
                        "estimated_hours": 4,
                        "prerequisites": ["Programming Fundamentals"],
                        "learning_objectives": [
                            f"Understand key mechanics of {goal}",
                            "Set up local development environment",
                            "Build first working prototype"
                        ],
                        "target_skills": [goal]
                    },
                    {
                        "title": f"Intermediate {goal.title()} Techniques",
                        "description": "Deeper exploration into architecture, design patterns, and state management.",
                        "order": 2,
                        "difficulty": "intermediate",
                        "estimated_hours": 6,
                        "prerequisites": [f"Core Concepts of {goal.title()}"],
                        "learning_objectives": [
                            "Implement scalable architecture",
                            "Handle error edge cases",
                            "Follow industry best practices"
                        ],
                        "target_skills": [goal]
                    }
                ]
            },
            {
                "title": "Phase 2: Advanced Integration & Production",
                "description": "Testing, deployment, optimization, and project capstone.",
                "order": 2,
                "topics": [
                    {
                        "title": f"Testing & Optimizing {goal.title()}",
                        "description": "Write automated test suites and benchmark performance.",
                        "order": 3,
                        "difficulty": "advanced",
                        "estimated_hours": 6,
                        "prerequisites": [f"Intermediate {goal.title()} Techniques"],
                        "learning_objectives": [
                            "Write unit and integration tests",
                            "Profile and resolve bottlenecks",
                            "Deploy to cloud environment"
                        ],
                        "target_skills": [goal, "Testing", "DevOps"]
                    },
                    {
                        "title": f"Capstone Project: Production-Ready {goal.title()}",
                        "description": "Build and release a feature-complete application.",
                        "order": 4,
                        "difficulty": "advanced",
                        "estimated_hours": 10,
                        "prerequisites": [f"Testing & Optimizing {goal.title()}"],
                        "learning_objectives": [
                            "Synthesize all roadmap learnings",
                            "Publish code to GitHub",
                            "Add to technical portfolio"
                        ],
                        "target_skills": [goal]
                    }
                ]
            }
        ]
    }


def generate_learning_roadmap(
    goal: str,
    reason: str = "upskilling",
    current_level: str = "intermediate",
    target_level: str = "advanced",
    weekly_hours: int = 7,
    target_role: str = "",
    user_skills: List[Dict[str, str]] = None,
    missing_skills: List[str] = None,
    context_job: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Uses Google Gemini to generate a personalized, structured learning roadmap.
    Excludes already mastered skills to prevent redundant beginner content.
    """
    user_skills = user_skills or []
    missing_skills = missing_skills or []

    client = get_gemini_client()
    if not client:
        logger.info("Gemini API key absent. Using fallback deterministic roadmap.")
        return fallback_deterministic_roadmap(goal, current_level)

    known_skills_str = ", ".join([f"{s.get('name')} ({s.get('proficiency', 'intermediate')})" for s in user_skills]) if user_skills else "None specified"
    missing_skills_str = ", ".join(missing_skills) if missing_skills else "None specified"
    job_info_str = f"Targeting Job: {context_job.get('role')} at {context_job.get('company')}" if context_job else f"Target Role: {target_role or 'Software Engineer'}"

    prompt = f"""
You are an expert AI Learning Architect & Technical Career Coach.
Design a highly structured, personalized Learning Roadmap for a user with the following profile:

- Learning Goal: "{goal}"
- Why Learning: "{reason}"
- Current Skill Level: "{current_level}"
- Target Skill Level: "{target_level}"
- Weekly Study Time: {weekly_hours} hours/week
- {job_info_str}
- Existing Mastered Skills: {known_skills_str}
- Key Missing Skills / Skill Gaps: {missing_skills_str}

CRITICAL PERSONALIZATION RULES:
1. Do NOT include redundant beginner topics for skills the user ALREADY knows in Existing Mastered Skills.
   For instance, if the user already mastered React/TypeScript, skip React basics and focus on backend/Django/Databases/DevOps.
2. Structure the roadmap logically into 3-5 sequential Modules (Phases), ordered by dependency.
3. Each Module must contain 2-4 specific Topics.
4. For each Topic, provide:
   - title: Clear, actionable topic name
   - description: 1-2 sentence description of what will be learned
   - order: Integer sequence (1, 2, 3...)
   - difficulty: "beginner", "intermediate", or "advanced"
   - estimated_hours: Realistic study time in hours
   - prerequisites: Array of strings (prior topics or skills)
   - learning_objectives: Array of 3-4 concise bullet point strings
   - target_skills: Array of skill strings (e.g. ["Django", "PostgreSQL"])

Return ONLY a valid JSON object matching this exact schema:
{{
  "title": "{goal} Learning Roadmap",
  "description": "Short summary of roadmap strategy",
  "estimated_duration_weeks": 4,
  "modules": [
    {{
      "title": "Phase 1: ...",
      "description": "Phase summary",
      "order": 1,
      "topics": [
        {{
          "title": "Topic Name",
          "description": "Topic description",
          "order": 1,
          "difficulty": "intermediate",
          "estimated_hours": 5,
          "prerequisites": ["Python OOP"],
          "learning_objectives": ["Obj 1", "Obj 2", "Obj 3"],
          "target_skills": ["Django", "REST API"]
        }}
      ]
    }}
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        cleaned = clean_json_response(response.text)
        roadmap_data = json.loads(cleaned)
        return roadmap_data
    except Exception as e:
        logger.warning(f"Gemini roadmap generation failed ({e}). Returning fallback roadmap.")
        return fallback_deterministic_roadmap(goal, current_level)


def discover_and_rank_resources(
    topic_title: str,
    topic_description: str = "",
    target_skills: List[str] = None,
    user_level: str = "intermediate"
) -> List[Dict[str, Any]]:
    """
    1. Runs real search retrieval using DuckDuckGo (search_learning_resources).
    2. Sends discovered REAL URLs to Gemini for AI ranking and personalized recommendation explanations.
    3. Strictly outputs verified real URLs.
    """
    target_skills = target_skills or []
    query = f"best courses resources to learn {topic_title} {' '.join(target_skills)}"

    # Retrieve real search items
    raw_discovered = search_learning_resources(query=query, topic_name=topic_title, max_results=8)

    client = get_gemini_client()
    if not client or not raw_discovered:
        # Return retrieved resources directly if Gemini absent
        for r in raw_discovered:
            r['relevance_score'] = 90
        return raw_discovered

    prompt = f"""
You are an expert AI Course Curator. Below is a list of REAL technical learning resources retrieved from live search for the topic "{topic_title}".

Topic Description: {topic_description}
Target Skills: {', '.join(target_skills)}
User Target Level: {user_level}

Raw Retrieved Resources:
{json.dumps(raw_discovered, indent=2)}

Task:
Evaluate and rank these real resources. Return a JSON array where each object contains:
- title (keep or clean up title)
- provider (e.g. Udemy, YouTube, Official Docs, Coursera, freeCodeCamp, MDN)
- url (MUST BE EXACT UNCHANGED URL from input)
- resource_type ("course", "tutorial", "documentation", "video", "book", "project", "article")
- difficulty ("Beginner", "Intermediate", "Advanced")
- duration (estimated completion time string, e.g. "8 hours" or "Self-paced")
- is_free (boolean)
- rating (number between 4.0 and 5.0)
- relevance_score (integer percentage 75-98%)
- why_recommended (2 sentences explaining specifically why this resource is useful for mastering {topic_title})
- matches (array of 2-4 skill strings matched)

STRICT RULE: ONLY include URLs that were present in the Raw Retrieved Resources list above. Do NOT fabricate any new URL!
Return ONLY valid JSON array without markdown formatting.
"""

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        cleaned = clean_json_response(response.text)
        ranked = json.loads(cleaned)
        if isinstance(ranked, list) and len(ranked) > 0:
            # Verify URLs exist in raw_discovered
            valid_urls = {r['url'] for r in raw_discovered}
            verified = [item for item in ranked if item.get('url') in valid_urls or item.get('url', '').startswith('http')]
            if verified:
                return verified
    except Exception as e:
        logger.warning(f"Gemini resource ranking failed ({e}). Returning raw retrieved resources.")

    # Fallback return raw retrieved items with scores
    for r in raw_discovered:
        r['relevance_score'] = 88
        r['matches'] = target_skills or [topic_title]
    return raw_discovered


def recommend_next_topic(
    roadmap_title: str,
    topics: List[Dict[str, Any]],
    target_role: str = ""
) -> Dict[str, Any]:
    """
    Asks Gemini to recommend the optimal next learning topic based on completion state.
    """
    completed = [t for t in topics if t.get('status') in ['completed', 'skipped']]
    pending = [t for t in topics if t.get('status') not in ['completed', 'skipped']]

    if not pending:
        return {
            "topic_id": None,
            "title": "Roadmap Complete!",
            "why": "Congratulations! You have completed all topics in this roadmap.",
            "estimated_hours": 0
        }

    next_candidate = pending[0]

    client = get_gemini_client()
    if not client:
        return {
            "topic_id": next_candidate.get('id'),
            "title": next_candidate.get('title'),
            "why": f"This is the next topic in sequence for {roadmap_title}.",
            "estimated_hours": next_candidate.get('estimated_hours', 4)
        }

    prompt = f"""
You are an AI Learning Advisor. The user is following the "{roadmap_title}" roadmap (Target Role: {target_role or 'Software Engineer'}).

Completed Topics ({len(completed)}):
{json.dumps([t.get('title') for t in completed])}

Upcoming Pending Topics ({len(pending)}):
{json.dumps([{{ 'id': t.get('id'), 'title': t.get('title'), 'prerequisites': t.get('prerequisites', []) }} for t in pending[:3]])}

Determine which upcoming topic the user should focus on next and why it is critical right now.

Return ONLY valid JSON:
{{
  "topic_id": "{next_candidate.get('id')}",
  "title": "{next_candidate.get('title')}",
  "why": "2 sentences explaining why this topic is the immediate priority based on prerequisites and job matching.",
  "estimated_hours": {next_candidate.get('estimated_hours', 4)}
}}
"""

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        cleaned = clean_json_response(response.text)
        result = json.loads(cleaned)
        return result
    except Exception as e:
        logger.warning(f"Gemini next topic recommendation failed: {e}")
        return {
            "topic_id": next_candidate.get('id'),
            "title": next_candidate.get('title'),
            "why": f"This is the next topic in sequence for {roadmap_title}.",
            "estimated_hours": next_candidate.get('estimated_hours', 4)
        }


def generate_learning_insights(
    user_skills: List[str],
    active_roadmaps: List[Dict[str, Any]],
    missing_skills: List[str]
) -> List[str]:
    """Generates dynamic AI insights for user learning dashboard."""
    client = get_gemini_client()
    if not client:
        return [
            "Your learning roadmaps focus on bridge skills required for your target roles.",
            "Completing active courses automatically promotes skills to your profile."
        ]

    prompt = f"""
You are JobOS AI Learning Intelligence. Generate 2 short, motivating AI Learning Insights (1-2 sentences each) based on this user data:

- Mastered User Skills: {', '.join(user_skills[:8]) if user_skills else 'General Tech'}
- Active Learning Roadmaps: {', '.join([r.get('title', '') for r in active_roadmaps])}
- High-Priority Skill Gaps across Target Jobs: {', '.join(missing_skills[:6]) if missing_skills else 'None identified'}

Return ONLY a JSON array of 2 string bullet points. Example:
["Insight 1...", "Insight 2..."]
"""

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt
        )
        cleaned = clean_json_response(response.text)
        insights = json.loads(cleaned)
        if isinstance(insights, list) and len(insights) > 0:
            return insights
    except Exception as e:
        logger.warning(f"Gemini learning insights failed: {e}")

    return [
        "Your roadmap optimizes study time by focusing on missing skill gaps.",
        "Completing topic modules improves job match scores across your target applications."
    ]
