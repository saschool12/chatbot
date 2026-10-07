# 🤖 NovaChat — Modern Java Spring Boot AI Chatbot Website

A complete, modern, responsive full-stack chatbot web application built with a **Java Spring Boot backend** and a sleek **ChatGPT-style HTML5, CSS3, and JavaScript frontend**.

![NovaChat UI](https://img.shields.io/badge/UI-ChatGPT--Style-10a37f?style=for-the-badge)
![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=for-the-badge)

---

## ✨ Features

### 🎨 Modern ChatGPT-Style Frontend
- **Dark Modern Aesthetic**: Inspired by ChatGPT with rich dark tones, smooth borders, and glow effects.
- **Collapsible Sidebar**:
  - **New Chat**: Starts a fresh conversation session (`Ctrl+N` / `⌘N`).
  - **Chat History**: Automatically saves conversations to `localStorage` with titles and timestamps. Switch or delete sessions anytime.
  - **Settings Modal**: Configure sound effects, typewriter animation, custom API URL, or clear local data.
  - **Mobile Responsive Drawer**: Smooth slide-in navigation drawer with backdrop on mobile devices.
- **Main Chat Area**:
  - **Welcome Hero Screen**: 4 starter prompt cards to quickly explore Java OOP, REST APIs, Jokes, and Math.
  - **User & Bot Messages**: Distinct avatars, timestamps, and one-click copy buttons.
  - **Rich Markdown Formatting**: Supports bold, italics, tables, bullet lists, inline code, and syntax-highlighted code blocks with a **Copy Code** button.
  - **Follow-up Suggestion Chips**: Dynamic clickable prompt chips returned with bot replies.
  - **Typing Animation**: 3-dot bouncing animation indicating the bot is thinking.
  - **Enter to Send**: Press `Enter` to send, `Shift+Enter` for multi-line messages.
  - **Sound Effects**: Audio chimes on sending and receiving messages synthesized via Web Audio API.
  - **Clear Chat**: Clear active chat with a single click.

### ⚡ Robust Java Spring Boot Backend
- **RESTful API**: Clean endpoint architecture at `/api/chat`.
- **Intelligent Rule-Based Engine**: Works 100% out of the box with zero external AI API keys or tokens required.
  - **Java & Spring Boot Q&A**: Explains OOP pillars, Java collections (`List` vs `Set`), exception handling, multithreading, and REST APIs with formatted code blocks.
  - **Web Tech**: HTML, CSS, JavaScript, and client-server architectures.
  - **Math Calculation Solver**: Evaluates arithmetic expressions (e.g., `45 * 12`, `100 / 4`, `sqrt(144)`).
  - **Real-Time Clock & Date**: Live server time and calendar dates.
  - **Humor & Motivation**: Curated developer jokes, trivia facts, and quotes.
  - **Persona Modes**: Adaptable responses for *Default*, *Friendly*, *Senior Java Coder*, and *Concise*.
- **Session History Support**: In-memory session tracking with `/api/chat/history` and `/api/chat/clear`.
- **CORS Configured**: Allows cross-origin requests from any client origin or `file://` protocol.
- **Embedded Web Server**: Spring Boot automatically serves the frontend at `http://localhost:8080/`.

---

## 📁 Project Structure

```text
hey/
├── backend/
│   ├── pom.xml                                  # Maven dependencies & build configuration
│   ├── mvnw / mvnw.cmd                          # Maven wrapper executables
│   └── src/
│       └── main/
│           ├── java/com/example/chatbot/
│           │   ├── ChatbotApplication.java      # Spring Boot main entry point
│           │   ├── config/
│           │   │   └── WebConfig.java           # CORS & web configuration
│           │   ├── controller/
│           │   │   └── ChatController.java      # REST endpoints (/api/chat)
│           │   ├── model/
│           │   │   ├── ChatMessage.java         # History message model
│           │   │   ├── ChatRequest.java         # Incoming request DTO
│           │   │   └── ChatResponse.java        # Response DTO with suggestions
│           │   └── service/
│           │       └── ChatService.java         # Rule-based chatbot logic
│           └── resources/
│               ├── application.properties       # Server configuration (port 8080)
│               └── static/                      # Static bundle served by Spring Boot
│                   ├── index.html
│                   ├── style.css
│                   └── script.js
│
├── frontend/                                    # Standalone frontend directory
│   ├── index.html                               # Modern HTML5 structure
│   ├── style.css                                # Dark ChatGPT theme & responsiveness
│   └── script.js                                # UI interactions & fetch() API client
│
├── run.sh                                       # One-click startup script
├── .gitignore                                   # Standard git ignore rules
└── README.md                                    # Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 17** or higher (`java -version`)
- **Maven 3.8+** (or use the included `./backend/mvnw`)

---

### Step 1: Run the Backend

#### Option A: Using the One-Click Script
```bash
chmod +x run.sh
./run.sh
```

#### Option B: Using Maven Directly
```bash
cd backend
mvn clean package -DskipTests
java -jar target/chatbot-backend-1.0.0.jar
```

Or run via Maven Spring Boot plugin:
```bash
cd backend
mvn spring-boot:run
```

The server will start at:
```text
http://localhost:8080
```

---

### Step 2: Open the Website

You have two convenient ways to use the chatbot:

#### Method 1: Directly via Spring Boot (Recommended)
Open your browser and navigate to:
```text
http://localhost:8080
```
Spring Boot serves the full frontend directly!

#### Method 2: Standalone Frontend
Double-click `frontend/index.html` or open it with VS Code Live Server / Python HTTP server:
```bash
cd frontend
python3 -m http.server 3000
```
Then visit `http://localhost:3000`. The frontend will automatically connect to `http://localhost:8080/api/chat`.

---

## 📡 REST API Reference

### 1. Send Message
- **Endpoint**: `POST /api/chat`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "message": "Explain Java OOP concepts",
  "conversationId": "session-123",
  "personality": "default"
}
```

**Response Body:**
```json
{
  "reply": "🧱 **The 4 Core Pillars of Object-Oriented Programming (OOP) in Java:**\n\n1. **Encapsulation**...",
  "conversationId": "session-123",
  "timestamp": "2026-10-07T05:31:49Z",
  "status": "success",
  "suggestions": [
    "What is Spring Boot?",
    "List vs Set",
    "Java Hello World"
  ]
}
```

---

### 2. Retrieve Conversation History
- **Endpoint**: `GET /api/chat/history?conversationId=session-123`
- **Response**: Array of message objects (`user` and `bot`).

---

### 3. Clear Chat Session
- **Endpoint**: `POST /api/chat/clear?conversationId=session-123`

---

### 4. Health Check
- **Endpoint**: `GET /api/chat/health`
- **Response:**
```json
{
  "status": "UP",
  "service": "Spring Boot Chatbot",
  "javaVersion": "17.0.20.1",
  "timestamp": "2026-10-07T05:31:43Z"
}
```

---

## 💬 Sample Prompts to Try

| Category | Example Prompts |
| :--- | :--- |
| **Java Basics** | `What is Java?`, `Java Hello World`, `List vs Set` |
| **Architecture** | `Explain OOP concepts`, `What is Spring Boot?`, `How to build a REST API` |
| **Calculations** | `calculate 125 * 8`, `what is 450 / 5`, `sqrt(144)` |
| **Date & Time** | `What time is it?`, `What is today's date?` |
| **Humor & Trivia** | `Tell me a joke`, `Tell me a fun fact`, `Inspire me` |
| **Interactive** | `Roll a dice`, `Flip a coin` |

---

## 🛠️ Tech Stack

- **Backend**: Java 17, Spring Boot 3.2.5, Spring MVC, Jackson
- **Frontend**: HTML5, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+ Fetch API, Web Audio API)
- **Styling**: ChatGPT Dark Modern Interface, JetBrains Mono & Inter typography

---

## 📄 License
This project is open-source and free to use.
