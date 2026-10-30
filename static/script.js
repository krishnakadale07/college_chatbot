/* ==========================================================================
   CampusBuddy - Frontend Interactive Script
   Handles chat messaging, voice input, GPA tool, attendance predictor, and themes.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const chatInput = document.getElementById("chat-input");
  const btnSend = document.getElementById("btn-send-message");
  const chatMessages = document.getElementById("chat-messages");
  const typingIndicator = document.getElementById("typing-indicator");
  const btnTheme = document.getElementById("btn-theme-toggle");
  const btnClear = document.getElementById("btn-clear-chat");
  const btnExport = document.getElementById("btn-export-chat");
  const btnVoice = document.getElementById("btn-voice-input");
  const toggleSidebar = document.getElementById("toggle-sidebar");
  const sidebar = document.getElementById("sidebar");
  const sidebarTopics = document.getElementById("sidebar-topics");
  const welcomeChips = document.getElementById("welcome-chips");

  // Modals
  const gpaModal = document.getElementById("gpa-modal");
  const attendanceModal = document.getElementById("attendance-modal");
  const emergencyModal = document.getElementById("emergency-modal");

  const openGpaBtn = document.getElementById("open-gpa-modal");
  const openAttBtn = document.getElementById("open-attendance-modal");
  const emergencyBtn = document.getElementById("emergency-btn");

  // Chat conversation memory for export
  let conversationHistory = [];

  // Initialize Initial Time
  const initialTimeEl = document.getElementById("initial-time");
  if (initialTimeEl) {
    initialTimeEl.textContent = formatCurrentTime();
  }

  // Fetch College Info & FAQ
  fetch("/api/info")
    .then(res => res.json())
    .then(data => {
      const faqs = data.quick_faq || [];
      populateSuggestions(faqs);
    })
    .catch(err => {
      console.warn("Could not fetch info endpoint:", err);
      // Fallback suggestions
      const fallbackFaqs = [
        { label: "📅 Exam Dates", query: "When are the semester exams?" },
        { label: "📊 75% Attendance Rule", query: "What is the attendance policy?" },
        { label: "📚 Library Hours", query: "What are the central library hours?" },
        { label: "🎓 GPA Formula", query: "How is GPA and CGPA calculated?" },
        { label: "🏢 Hostel Curfew", query: "What are the hostel gate timings?" },
        { label: "📶 Campus Wi-Fi", query: "How to connect to campus Wi-Fi?" },
        { label: "🚨 Emergency Contacts", query: "Show me campus emergency numbers" },
        { label: "💡 Study Tips", query: "Give me study tips for exams" }
      ];
      populateSuggestions(fallbackFaqs);
    });

  function populateSuggestions(items) {
    if (welcomeChips) {
      welcomeChips.innerHTML = "";
      items.slice(0, 8).forEach(item => {
        const btn = document.createElement("button");
        btn.className = "chip-btn";
        btn.innerHTML = item.label;
        btn.addEventListener("click", () => {
          sendUserMessage(item.query);
        });
        welcomeChips.appendChild(btn);
      });
    }

    if (sidebarTopics) {
      sidebarTopics.innerHTML = "";
      items.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "topic-item";
        btn.innerHTML = item.label;
        btn.addEventListener("click", () => {
          sendUserMessage(item.query);
          if (window.innerWidth <= 900) {
            sidebar.classList.remove("open");
          }
        });
        sidebarTopics.appendChild(btn);
      });
    }
  }

  // Format Time helper
  function formatCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Parse Markdown basics to safe HTML
  function formatMarkdown(text) {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Unordered lists
    html = html.replace(/^\s*-\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
    html = html.replace(/<\/ul>\s*<ul>/g, "");

    // Numbered lists
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>");

    // Paragraph line breaks
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    return `<p>${html}</p>`;
  }

  // Append User Bubble
  function appendUserMessage(text) {
    const time = formatCurrentTime();
    const row = document.createElement("div");
    row.className = "message-row user-row animate-fade-in";
    row.innerHTML = `
      <div class="message-bubble user-bubble">
        <div class="bubble-header">
          <span class="sender-name">You</span>
          <span class="timestamp">${time}</span>
        </div>
        <div class="bubble-content">
          <p>${escapeHtml(text)}</p>
        </div>
      </div>
    `;
    chatMessages.appendChild(row);
    scrollToBottom();

    conversationHistory.push({ sender: "Student", text: text, time: time });
  }

  // Append Bot Bubble
  function appendBotMessage(text, tag = "") {
    const time = formatCurrentTime();
    const row = document.createElement("div");
    row.className = "message-row bot-row animate-fade-in";

    const formattedContent = formatMarkdown(text);

    row.innerHTML = `
      <div class="bot-avatar">🤖</div>
      <div class="message-bubble bot-bubble">
        <div class="bubble-header">
          <span class="sender-name">CampusBuddy</span>
          <span class="timestamp">${time}</span>
        </div>
        <div class="bubble-content">
          ${formattedContent}
        </div>
      </div>
    `;
    chatMessages.appendChild(row);
    scrollToBottom();

    conversationHistory.push({ sender: "CampusBuddy", text: text, time: time });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }

  // Send Message Logic
  function sendUserMessage(msgOverride) {
    const text = (msgOverride !== undefined ? msgOverride : chatInput.value).trim();
    if (!text) return;

    appendUserMessage(text);
    if (!msgOverride) chatInput.value = "";

    // Show typing indicator
    typingIndicator.style.display = "flex";
    scrollToBottom();

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    })
      .then(res => res.json())
      .then(data => {
        typingIndicator.style.display = "none";
        appendBotMessage(data.reply || "Sorry, I encountered an issue.", data.tag);
      })
      .catch(err => {
        typingIndicator.style.display = "none";
        appendBotMessage("⚠️ Unable to reach college servers. Please check your connection or restart the app.");
        console.error("Chat API error:", err);
      });
  }

  // Event Listeners for Chat
  btnSend.addEventListener("click", () => sendUserMessage());

  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // Clear Chat
  btnClear.addEventListener("click", () => {
    if (confirm("Clear your current conversation history?")) {
      chatMessages.innerHTML = `
        <div class="message-row bot-row animate-fade-in">
          <div class="bot-avatar">🤖</div>
          <div class="message-bubble bot-bubble">
            <div class="bubble-header">
              <span class="sender-name">CampusBuddy</span>
              <span class="timestamp">${formatCurrentTime()}</span>
            </div>
            <div class="bubble-content">
              <p>Chat cleared! How can I help you today?</p>
            </div>
            <div class="welcome-suggestions" id="welcome-chips"></div>
          </div>
        </div>
      `;
      conversationHistory = [];
      fetch("/api/info")
        .then(r => r.json())
        .then(d => populateSuggestions(d.quick_faq || []));
    }
  });

  // Export Chat Transcript
  btnExport.addEventListener("click", () => {
    if (conversationHistory.length === 0) {
      alert("No messages to export yet!");
      return;
    }
    let transcript = "=== CampusBuddy Chatbot Transcript ===\n";
    transcript += `Exported on: ${new Date().toLocaleString()}\n\n`;
    conversationHistory.forEach(entry => {
      transcript += `[${entry.time}] ${entry.sender}:\n${entry.text}\n\n`;
    });

    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `college_chat_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Theme Toggle
  const savedTheme = localStorage.getItem("campus_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    btnTheme.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  btnTheme.addEventListener("click", () => {
    if (document.body.classList.contains("theme-dark")) {
      document.body.classList.remove("theme-dark");
      document.body.classList.add("theme-light");
      btnTheme.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem("campus_theme", "light");
    } else {
      document.body.classList.remove("theme-light");
      document.body.classList.add("theme-dark");
      btnTheme.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem("campus_theme", "dark");
    }
  });

  // Mobile Sidebar Toggle
  if (toggleSidebar) {
    toggleSidebar.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Voice Recognition (Speech to Text)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isRecording = false;

    btnVoice.addEventListener("click", () => {
      if (!isRecording) {
        recognition.start();
        btnVoice.classList.add("recording");
        isRecording = true;
      } else {
        recognition.stop();
        btnVoice.classList.remove("recording");
        isRecording = false;
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      btnVoice.classList.remove("recording");
      isRecording = false;
      sendUserMessage();
    };

    recognition.onerror = () => {
      btnVoice.classList.remove("recording");
      isRecording = false;
    };

    recognition.onend = () => {
      btnVoice.classList.remove("recording");
      isRecording = false;
    };
  } else {
    btnVoice.style.opacity = "0.5";
    btnVoice.title = "Voice recognition is not supported in this browser.";
  }

  // Modals Open / Close Handlers
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      const target = document.getElementById(modalId);
      if (target) target.style.display = "none";
    });
  });

  // Close modal when clicking outside modal card
  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  if (openGpaBtn) {
    openGpaBtn.addEventListener("click", () => {
      gpaModal.style.display = "flex";
    });
  }

  if (openAttBtn) {
    openAttBtn.addEventListener("click", () => {
      attendanceModal.style.display = "flex";
    });
  }

  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", () => {
      emergencyModal.style.display = "flex";
    });
  }

  // ==========================================================================
  // GPA CALCULATOR LOGIC
  // ==========================================================================
  const courseRows = document.getElementById("course-rows");
  const btnAddCourse = document.getElementById("btn-add-course");
  const btnComputeGpa = document.getElementById("btn-compute-gpa");
  const gpaResultBox = document.getElementById("gpa-result-box");
  const resGpaVal = document.getElementById("res-gpa-val");
  const resGpaSub = document.getElementById("res-gpa-sub");

  if (btnAddCourse) {
    btnAddCourse.addEventListener("click", () => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="text" class="course-name" placeholder="Subject name"></td>
        <td><input type="number" class="course-credits" value="3" min="1" max="10"></td>
        <td>
          <select class="course-grade">
            <option value="O">O (10 pts)</option>
            <option value="A+" selected>A+ (10 pts)</option>
            <option value="A">A (9 pts)</option>
            <option value="B+">B+ (8 pts)</option>
            <option value="B">B (7 pts)</option>
            <option value="C">C (6 pts)</option>
            <option value="P">P (5 pts)</option>
            <option value="F">F (0 pts)</option>
          </select>
        </td>
        <td><button class="btn-remove-row" title="Remove">&times;</button></td>
      `;
      courseRows.appendChild(tr);
    });
  }

  if (courseRows) {
    courseRows.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-remove-row")) {
        const row = e.target.closest("tr");
        if (courseRows.querySelectorAll("tr").length > 1) {
          row.remove();
        } else {
          alert("You must have at least one course row!");
        }
      }
    });
  }

  if (btnComputeGpa) {
    btnComputeGpa.addEventListener("click", () => {
      const rows = courseRows.querySelectorAll("tr");
      const courses = [];

      rows.forEach(r => {
        const name = r.querySelector(".course-name").value.trim() || "Subject";
        const credits = parseFloat(r.querySelector(".course-credits").value) || 0;
        const grade = r.querySelector(".course-grade").value;
        if (credits > 0) {
          courses.push({ name, credits, grade });
        }
      });

      if (courses.length === 0) {
        alert("Please enter valid courses with credits greater than 0.");
        return;
      }

      fetch("/api/calculate-gpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          gpaResultBox.style.display = "block";
          resGpaVal.textContent = data.sgpa.toFixed(2);
          resGpaSub.innerHTML = `
            Total Credits: <strong>${data.total_credits}</strong> | 
            Equivalent Percentage: <strong>${data.percentage_equivalent}%</strong>
          `;
        })
        .catch(err => {
          alert("Error calculating GPA.");
          console.error(err);
        });
    });
  }

  // ==========================================================================
  // ATTENDANCE CALCULATOR LOGIC
  // ==========================================================================
  const attAttended = document.getElementById("att-attended");
  const attTotal = document.getElementById("att-total");
  const attTarget = document.getElementById("att-target");
  const btnComputeAtt = document.getElementById("btn-compute-attendance");
  const attResultBox = document.getElementById("att-result-box");
  const attBadge = document.getElementById("att-badge");
  const attPctVal = document.getElementById("att-pct-val");
  const attAdvice = document.getElementById("att-advice");

  if (btnComputeAtt) {
    btnComputeAtt.addEventListener("click", () => {
      const attended = parseInt(attAttended.value, 10);
      const total = parseInt(attTotal.value, 10);
      const target = parseFloat(attTarget.value);

      if (isNaN(attended) || isNaN(total) || total <= 0) {
        alert("Please enter valid numbers for classes attended and total classes.");
        return;
      }

      fetch("/api/calculate-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attended, total, target })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          attResultBox.style.display = "block";
          attPctVal.textContent = `${data.current_percentage}%`;

          if (data.status === "Safe") {
            attBadge.className = "att-status-badge safe";
            attBadge.textContent = "SAFE TO BUNK";
          } else {
            attBadge.className = "att-status-badge shortage";
            attBadge.textContent = "ATTENDANCE SHORTAGE";
          }
          attAdvice.innerHTML = formatMarkdown(data.message);
        })
        .catch(err => {
          alert("Error calculating attendance.");
          console.error(err);
        });
    });
  }
});
