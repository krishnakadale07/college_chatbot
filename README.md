# 🎓 CampusBuddy - College Student ChatBot

An intelligent, interactive, and responsive web-based ChatBot designed specifically for college students. It helps students navigate campus life, check exam dates, understand attendance rules, calculate SGPA/CGPA, inspect hostel and cafeteria timings, and reach 24/7 campus emergency helplines.

---

## 🌟 Key Features

1. **Intelligent Query Resolution**:
   - Rule-based NLP intent recognition and keyword scoring.
   - **Fuzzy typo tolerance**: Handles misspellings like *"atendance"*, *"libary"*, *"canten"*, or *"schedul"*.
   - Covers Academics, Exams, Library, Wi-Fi access, Hostels, Canteen menus, Scholarships, Placements, and Emergency numbers.

2. **Academic Productivity Tools**:
   - 📊 **Attendance Predictor**: Calculates current attendance percentage, alerts students if they are below the mandatory 75% threshold, and calculates exactly how many consecutive classes they must attend or can safely miss.
   - 🎓 **Interactive SGPA / CGPA Calculator**: Add semester subjects, credits, and grades to automatically compute your GPA and percentage equivalent.

3. **Modern Student-Centric UI**:
   - 🌓 **Dark & Light Mode** toggle with instant local storage persistence.
   - 🎙️ **Voice Typing (Speech-to-Text)** via Web Speech API.
   - 💬 **1-Click Quick Suggestion Chips** for fast navigation.
   - 📑 **Export Chat Transcript** to text file for notes or records.
   - 📱 Fully responsive layout for desktop, tablet, and mobile screens.

4. **Zero-API-Key Out of the Box**:
   - Completely standalone: runs locally without requiring paid third-party API keys.
   - Easily customizable via a simple JSON file (`knowledge_base.json`).

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.10+ (Python 3.14 compatible)
- `flask` installed (`pip install flask`)

### 2. Run the Application
In your terminal, navigate to the project directory and run:
```bash
python app.py
```

### 3. Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🛠️ Project Structure

```
college_chatbot/
├── app.py                  # Flask web server and REST API endpoints
├── bot_engine.py           # NLP intent engine, fuzzy matcher & calculators
├── knowledge_base.json     # Campus FAQs, intents, keywords, and college info
├── requirements.txt        # Python dependencies
├── static/
│   ├── style.css           # Modern CSS styling with Dark/Light themes
│   └── script.js           # Client-side messaging, modals, voice recognition
├── templates/
│   └── index.html          # Web UI template
└── README.md               # Documentation
```

---

## ⚙️ Customizing for Your College

To adapt CampusBuddy for your specific institution, edit `knowledge_base.json`:
1. Change `college_info`: Name, acronym, current semester, and exam period.
2. Add or modify `intents`: Insert topics, FAQs, and customized responses for your department, professors, or campus policies.
3. Save the file and restart the server (`python app.py`).
