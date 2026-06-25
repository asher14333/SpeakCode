import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

STARTER_MARKERS = ("# Write your solution here", "pass\n", "pass\r")


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

EVALUATION_PROMPT = """You are a senior software engineer conducting a coding interview.

Analyze this candidate's verbal explanation of the Two Sum problem.

Problem:
Two Sum — Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Candidate explanation:
{transcript}

Scoring rubric (be fair and calibrated):
- 9-10: Covers problem restatement, brute force + why it's slow, optimized approach with clear logic, time AND space complexity, clear communication. This is a strong pass.
- 7-8: Covers most of the above with minor gaps (e.g. brute force mentioned briefly but not expanded, no walkthrough example).
- 5-6: Understands the problem but missing key pieces (no complexity, vague on approach).
- Below 5: Major gaps or incorrect logic.

Critical rules:
1. ONLY list an improvement if the candidate did NOT already address it. Read the transcript carefully — do not suggest they mention something they already said.
2. Each strength must reference something specific the candidate actually said or demonstrated.
3. Do NOT invent speech-to-text errors (e.g. do not correct "two some" unless that exact phrase appears in the transcript).
4. If code is provided and is only a starter template (e.g. contains "pass" or "# Write your solution here"), do NOT praise or critique the code — evaluate the verbal explanation only.
5. If no real code was written, do NOT mention code implementation in strengths or improvements.
6. Be encouraging but honest. A complete explanation like brute force → hash map → complement check → O(n) time/space should score 8-9, not 6.
7. Improvements should be genuinely useful next steps, not nitpicks for things already covered.

Return a JSON object with exactly these fields:
- score: number from 1 to 10 (can use halves, e.g. 8.5)
- passed: boolean, true if score is 7 or higher and the explanation demonstrates real understanding
- strengths: array of 2-4 strings, each citing something specific the candidate did well
- improvements: array of 0-3 strings, ONLY for things actually missing or unclear — return an empty array if the explanation is strong

Return ONLY valid JSON, no markdown."""


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    transcript = (data or {}).get("transcript", "").strip()
    code = (data or {}).get("code", "").strip()

    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "OPENAI_API_KEY is not configured"}), 500

    client = get_client()

    code_section = ""
    if code and not any(marker in code for marker in STARTER_MARKERS):
        code_section = f"\n\nCandidate's code:\n```\n{code}\n```"

    prompt = EVALUATION_PROMPT.format(
        transcript=transcript + code_section
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a fair, calibrated technical interviewer. "
                        "Only criticize what is actually missing from the transcript. "
                        "Never hallucinate issues. Always respond with valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5001)
