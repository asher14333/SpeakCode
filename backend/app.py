import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

EVALUATION_PROMPT = """You are a senior software engineer conducting a coding interview.

Analyze this candidate's explanation of a LeetCode solution.

Problem:
Two Sum

Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Candidate explanation:
{transcript}

Evaluate:

1. Did they understand the problem?
2. Did they explain brute force first?
3. Did they justify their optimized approach?
4. Did they discuss time complexity?
5. Did they discuss space complexity?
6. How clear is their communication?

Return a JSON object with exactly these fields:
- score: integer from 1 to 10
- strengths: array of strings (each a specific strength)
- improvements: array of strings (each a specific improvement)

Return ONLY valid JSON, no markdown."""


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    transcript = (data or {}).get("transcript", "").strip()

    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    if not os.getenv("OPENAI_API_KEY"):
        return jsonify({"error": "OPENAI_API_KEY is not configured"}), 500

    client = get_client()

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software engineer evaluating coding "
                        "interview explanations. Always respond with valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": EVALUATION_PROMPT.format(transcript=transcript),
                },
            ],
            response_format={"type": "json_object"},
        )

        result = json.loads(response.choices[0].message.content)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
