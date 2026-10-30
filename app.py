"""
app.py - Flask Server for CampusBuddy College Student Chatbot
"""

import os
import re
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from bot_engine import CampusBotEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    template_folder=os.path.join(BASE_DIR, "templates")
)

# Path to the knowledge base
KB_PATH = os.path.join(BASE_DIR, "knowledge_base.json")

engine = CampusBotEngine(KB_PATH)

@app.route("/")
def home():
    return render_template("index.html", college=engine.college_info)

@app.route("/api/info", methods=["GET"])
def get_info():
    return jsonify({
        "college_info": engine.college_info,
        "quick_faq": engine.faq_quick_list
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"reply": "Please enter a question or click a suggestion below!", "tag": "empty"}), 400

    # Check for direct attendance queries like "attendance 20 25" or "20 out of 25 classes"
    att_match = re.search(r'(?:attendance\s+)?(\d+)\s*(?:out of|/|\s+)\s*(\d+)', message, re.IGNORECASE)
    if att_match and ("attend" in message.lower() or "classes" in message.lower() or "/" in message):
        try:
            attended = int(att_match.group(1))
            total = int(att_match.group(2))
            res = engine.calculate_attendance(attended, total)
            if "error" not in res:
                return jsonify({
                    "reply": res["message"],
                    "tag": "attendance_calculator",
                    "data": res,
                    "timestamp": datetime.now().strftime("%I:%M %p")
                })
        except Exception:
            pass

    tag, reply, score = engine.match_intent(message)

    return jsonify({
        "reply": reply,
        "tag": tag,
        "score": round(score, 2),
        "timestamp": datetime.now().strftime("%I:%M %p")
    })

@app.route("/api/calculate-attendance", methods=["POST"])
def api_calculate_attendance():
    data = request.get_json() or {}
    try:
        attended = int(data.get("attended", 0))
        total = int(data.get("total", 0))
        target = float(data.get("target", 75.0))
        result = engine.calculate_attendance(attended, total, target)
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input parameters: {str(e)}"}), 400

@app.route("/api/calculate-gpa", methods=["POST"])
def api_calculate_gpa():
    data = request.get_json() or {}
    courses = data.get("courses", [])
    if not courses:
        return jsonify({"error": "Please provide at least one course."}), 400
    try:
        result = engine.calculate_gpa(courses)
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Calculation error: {str(e)}"}), 400

if __name__ == "__main__":
    print(f"Starting CampusBuddy for {engine.college_info.get('name', 'College')}...")
    app.run(host="127.0.0.1", port=5000, debug=True)
