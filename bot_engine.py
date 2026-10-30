"""
bot_engine.py - Core NLP Matching and Assistant Engine for College Students
Provides intent recognition, fuzzy matching, and academic calculations.
"""

import json
import re
import random
import difflib
from typing import Dict, Any, Tuple, List

class CampusBotEngine:
    def __init__(self, kb_path: str):
        self.kb_path = kb_path
        self.knowledge = self.load_knowledge_base()
        self.intents = self.knowledge.get("intents", [])
        self.college_info = self.knowledge.get("college_info", {})
        self.faq_quick_list = self.knowledge.get("faq_quick_list", [])

    def load_knowledge_base(self) -> Dict[str, Any]:
        with open(self.kb_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def preprocess(self, text: str) -> List[str]:
        """Normalize text into lowercase alphanumeric tokens."""
        text = text.lower()
        tokens = re.findall(r'\b[a-z0-9%+-]+\b', text)
        return tokens

    def match_intent(self, user_message: str) -> Tuple[str, str, float]:
        """
        Determines the best matching intent tag based on keyword frequency,
        token overlap, and fuzzy string similarity.
        Returns: (matched_tag, response_text, confidence_score)
        """
        user_tokens = set(self.preprocess(user_message))
        if not user_tokens:
            return "empty", "Please type a question or pick one of the quick suggestions below!", 1.0

        best_tag = None
        best_score = 0.0
        best_response = None

        raw_lower = user_message.lower().strip()

        for intent in self.intents:
            tag = intent["tag"]
            keywords = intent["keywords"]
            score = 0.0

            for kw in keywords:
                kw_lower = kw.lower()
                # Exact phrase match gives highest boost
                if kw_lower in raw_lower:
                    score += 3.0
                else:
                    # Token matching
                    kw_tokens = set(self.preprocess(kw_lower))
                    intersection = user_tokens.intersection(kw_tokens)
                    if intersection:
                        score += 2.0 * len(intersection)
                    else:
                        # Fuzzy match on individual words (handles typos like "libary", "atendance", "schedul")
                        for ut in user_tokens:
                            if len(ut) >= 3:
                                for kw_token in kw_tokens:
                                    if len(kw_token) >= 3:
                                        similarity = difflib.SequenceMatcher(None, ut, kw_token).ratio()
                                        if similarity >= 0.80:
                                            score += 1.8 * similarity

            if score > best_score:
                best_score = score
                best_tag = tag
                best_response = random.choice(intent["responses"])

        # Threshold check:
        if best_score >= 1.5 and best_response:
            return best_tag, best_response, best_score

        # Default fallback response
        fallback = (
            "🤔 I'm not completely sure about that specific query yet. "
            "Here are some popular college topics you can ask me about:\n\n"
            "- 📅 **Exam Schedules & Midterms**\n"
            "- 📊 **Attendance Rules (75% policy)**\n"
            "- 📚 **Library Timings & Book Issuing**\n"
            "- 🎓 **GPA & Grade Calculations**\n"
            "- 🏢 **Hostel Gate Timings & Rules**\n"
            "- 📶 **Wi-Fi & Portal Login Support**\n"
            "- 🍽️ **Canteen & Mess Timings**\n"
            "- 🚨 **Campus Emergency Helplines**\n\n"
            "Or try clicking any of the quick suggestions below!"
        )
        return "fallback", fallback, best_score

    @staticmethod
    def calculate_attendance(attended: int, total: int, target_percent: float = 75.0) -> Dict[str, Any]:
        """
        Calculates attendance statistics and informs student:
        - Current attendance %
        - How many consecutive classes they can miss without falling below target %
        - OR how many consecutive classes they must attend to reach target %
        """
        if total <= 0:
            return {
                "error": "Total classes must be greater than zero."
            }
        if attended > total:
            return {
                "error": "Attended classes cannot exceed total classes."
            }

        current_pct = (attended / total) * 100.0
        target_fraction = target_percent / 100.0

        if current_pct >= target_percent:
            # Safe! How many can they miss?
            # (attended) / (total + x) >= target_fraction
            # attended >= target_fraction * (total + x)
            # attended / target_fraction >= total + x
            # x <= (attended / target_fraction) - total
            max_missable = int((attended / target_fraction) - total)
            status = "Safe"
            message = (
                f"🎉 **Great job!** Your current attendance is **{current_pct:.1f}%**.\n"
                f"You can safely miss **{max_missable}** more class{'es' if max_missable != 1 else ''} "
                f"and still maintain the required {target_percent}% threshold."
            )
        else:
            # Below target! How many must they attend?
            # (attended + y) / (total + y) >= target_fraction
            # attended + y >= target_fraction * total + target_fraction * y
            # y * (1 - target_fraction) >= (target_fraction * total) - attended
            needed = int(((target_fraction * total) - attended) / (1.0 - target_fraction) + 0.999999)
            status = "Shortage"
            message = (
                f"⚠️ **Attendance Warning!** Your current attendance is **{current_pct:.1f}%**.\n"
                f"You need to attend **{needed}** consecutive class{'es' if needed != 1 else ''} without missing "
                f"to achieve the mandatory {target_percent}% attendance."
            )

        return {
            "attended": attended,
            "total": total,
            "current_percentage": round(current_pct, 2),
            "target_percentage": target_percent,
            "status": status,
            "message": message
        }

    @staticmethod
    def calculate_gpa(courses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates SGPA from a list of courses:
        Each course has: {'name': str, 'credits': float, 'grade': str}
        """
        grade_points_map = {
            "O": 10.0, "A+": 10.0,
            "A": 9.0,
            "B+": 8.0,
            "B": 7.0,
            "C": 6.0,
            "P": 5.0,
            "F": 0.0
        }

        total_credits = 0.0
        weighted_points = 0.0
        results = []

        for c in courses:
            name = c.get("name", "Subject")
            credits = float(c.get("credits", 0))
            grade = str(c.get("grade", "A")).upper().strip()
            pts = grade_points_map.get(grade, 0.0)

            total_credits += credits
            weighted_points += (credits * pts)
            results.append({
                "name": name,
                "credits": credits,
                "grade": grade,
                "points": pts
            })

        if total_credits == 0:
            return {"error": "Total course credits cannot be zero."}

        sgpa = round(weighted_points / total_credits, 2)
        percentage_equiv = round((sgpa - 0.75) * 10, 1) if sgpa >= 0.75 else 0.0

        return {
            "total_credits": total_credits,
            "sgpa": sgpa,
            "percentage_equivalent": max(percentage_equiv, 0.0),
            "course_details": results
        }
