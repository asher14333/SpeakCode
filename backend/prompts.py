RUBRIC_DIMENSIONS = [
    ("problemUnderstanding", "Problem Understanding", 2),
    ("bruteForce", "Brute Force Approach", 2),
    ("optimization", "Optimized Approach", 2),
    ("timeComplexity", "Time Complexity", 1),
    ("spaceComplexity", "Space Complexity", 1),
    ("clarity", "Communication Clarity", 2),
]

STARTER_MARKERS = ("# Write your solution here", "pass\n", "pass\r")


def is_starter_code(code: str) -> bool:
    return not code or any(marker in code for marker in STARTER_MARKERS)


def build_analyze_prompt(problem: dict, transcript: str, code: str) -> str:
    code_section = ""
    if code and not is_starter_code(code):
        code_section = f"\n\nCandidate's code:\n```\n{code}\n```"

    rubric_lines = "\n".join(
        f'- {key}: score 0-{max_score}, include "quote" (exact phrase from transcript or null) and "note" (brief justification)'
        for key, label, max_score in RUBRIC_DIMENSIONS
    )

    return f"""You are a senior software engineer conducting a coding interview.

Problem: {problem["title"]}
{problem["description"]}

Candidate explanation:
{transcript}{code_section}

Score each rubric dimension independently. Total score = sum of dimension scores (max 10).

Rubric dimensions:
{rubric_lines}

Critical rules:
1. ONLY list an improvement if the candidate did NOT already address it in the transcript.
2. Each strength MUST include a "quote" — an exact short phrase from the transcript that supports it. If no exact quote exists, omit that strength.
3. Each improvement should have "quote": null unless quoting what they said that was unclear.
4. Do NOT invent speech-to-text errors.
5. If code is starter template only, evaluate verbal explanation only — do not mention code.
6. A complete explanation (problem → brute force → optimization → complexities) should total 8-10.

Return JSON:
{{
  "score": <sum of rubric scores, number>,
  "passed": <true if score >= 7>,
  "rubric": {{
    "<dimensionKey>": {{ "score": <number>, "max": <number>, "quote": "<exact quote or null>", "note": "<brief note>" }}
  }},
  "strengths": [{{ "text": "<strength>", "quote": "<exact quote from transcript>" }}],
  "improvements": [{{ "text": "<improvement>", "quote": null }}]
}}

Return ONLY valid JSON."""


def build_interview_prompt(problem: dict, transcript: str, history: list, code: str) -> str:
    code_section = ""
    if code and not is_starter_code(code):
        code_section = f"\n\nCandidate's code:\n```\n{code}\n```"

    history_text = ""
    if history:
        history_text = "\n\nFollow-up conversation so far:\n"
    for msg in history:
        if msg.get("role") == "evaluation":
            history_text += f"Feedback: {msg['content']}\n"
            continue
        role = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
        history_text += f"{role}: {msg['content']}\n"

    interviewer_count = sum(
        1 for msg in history if msg.get("role") == "interviewer"
    )
    at_limit = interviewer_count >= 3

    return f"""You are a senior engineer conducting a live coding interview follow-up.

Problem: {problem["title"]}
{problem["description"]}

Candidate's initial explanation:
{transcript}{code_section}{history_text}

Your task:
- Evaluate the candidate's latest answer (the last Candidate message).
- If fewer than 3 follow-ups have been asked and the answer warrants more probing, ask ONE new follow-up question.
- If 3 questions have already been asked ({interviewer_count} so far), set complete=true and do not ask another question.
{"- You have already asked 3 questions. Set complete=true." if at_limit else ""}

Return JSON:
{{
  "complete": <boolean, true if interview follow-ups are done>,
  "answerEvaluation": {{
    "score": <1-10 for the latest answer, or null if no answer to evaluate>,
    "feedback": "<brief feedback on latest answer, or null>",
    "quote": "<exact phrase from latest answer that was good or weak, or null>"
  }},
  "nextQuestion": "<next follow-up question, or null if complete>",
  "overallNote": "<one sentence summary of follow-up performance, only when complete>"
}}

Return ONLY valid JSON."""


def build_interview_start_prompt(problem: dict, transcript: str, code: str) -> str:
    code_section = ""
    if code and not is_starter_code(code):
        code_section = f"\n\nCandidate's code:\n```\n{code}\n```"

    return f"""You are a senior engineer starting the follow-up portion of a coding interview.

Problem: {problem["title"]}
{problem["description"]}

Candidate's initial explanation:
{transcript}{code_section}

Ask ONE insightful follow-up question based on gaps or interesting choices in their explanation.
Do not repeat what they already explained well. Probe deeper like a real interviewer.

Return JSON:
{{ "question": "<follow-up question>" }}

Return ONLY valid JSON."""
