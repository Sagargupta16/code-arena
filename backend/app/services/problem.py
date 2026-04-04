from __future__ import annotations

import random
import re
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.db import get_db

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

CODE_SNIPPETS_QUERY = """
query questionEditorData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    codeSnippets { lang langSlug code }
  }
}
"""


async def fetch_problems_list(
    difficulty: str | None = None,
    tags: list[str] | None = None,
    limit: int = 50,
) -> list[dict]:
    async with httpx.AsyncClient(base_url=settings.leetcode_api_url) as client:
        resp = await client.get("/problems", params={"limit": limit})
        resp.raise_for_status()
        data = resp.json()

    problems = data.get("problemsetQuestionList", [])
    if difficulty:
        problems = [p for p in problems if p.get("difficulty") == difficulty]
    if tags:
        tag_set = {t.lower() for t in tags}
        problems = [
            p for p in problems
            if tag_set & {t["slug"].lower() for t in p.get("topicTags", [])}
        ]
    return problems


async def fetch_problem_detail(slug: str) -> dict:
    async with httpx.AsyncClient(base_url=settings.leetcode_api_url) as client:
        resp = await client.get("/select", params={"titleSlug": slug})
        resp.raise_for_status()
        return resp.json()


async def fetch_code_snippets(slug: str) -> dict[str, str]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": CODE_SNIPPETS_QUERY, "variables": {"titleSlug": slug}},
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()

        snippets = data.get("data", {}).get("question", {}).get("codeSnippets", [])
        result: dict[str, str] = {}
        for s in snippets:
            if s["langSlug"] == "cpp":
                result["cpp"] = s["code"]
            elif s["langSlug"] == "python3":
                result["python"] = s["code"]
        return result
    except Exception:
        return {}


def parse_sample_cases(description: str) -> list[dict]:
    cases = []
    input_pattern = re.compile(r"<strong>Input:</strong>\s*(.*?)\s*<", re.DOTALL)
    output_pattern = re.compile(r"<strong>Output:</strong>\s*(.*?)\s*<", re.DOTALL)

    inputs = input_pattern.findall(description)
    outputs = output_pattern.findall(description)

    for inp, out in zip(inputs, outputs):
        cases.append({
            "input": inp.strip(),
            "expected_output": out.strip(),
            "is_sample": True,
        })
    return cases


async def get_random_problem(
    difficulty: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    db = get_db()

    problems = await fetch_problems_list(difficulty=difficulty, tags=tags)
    if not problems:
        raise ValueError("No problems found matching filters")

    chosen = random.choice(problems)
    slug = chosen["titleSlug"]

    cached = await db.problems.find_one({"slug": slug})
    if cached and cached.get("code_snippets", {}).get("cpp"):
        return cached

    detail = await fetch_problem_detail(slug)
    test_cases = parse_sample_cases(detail.get("question", ""))
    code_snippets = await fetch_code_snippets(slug)

    problem_doc = {
        "_id": slug,
        "leetcode_id": int(chosen.get("questionFrontendId", 0)),
        "title": chosen.get("title", slug),
        "slug": slug,
        "difficulty": chosen.get("difficulty", "Medium"),
        "description": detail.get("question", ""),
        "tags": [t["slug"] for t in chosen.get("topicTags", [])],
        "test_cases": test_cases,
        "code_snippets": code_snippets,
        "time_limit_ms": {"Easy": 2000, "Medium": 3000, "Hard": 5000}.get(
            chosen.get("difficulty", "Medium"), 3000
        ),
        "memory_limit_mb": 256,
        "fetched_at": datetime.now(timezone.utc),
    }

    await db.problems.replace_one({"_id": slug}, problem_doc, upsert=True)
    return problem_doc
