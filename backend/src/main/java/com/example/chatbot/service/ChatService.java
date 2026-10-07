package com.example.chatbot.service;

import com.example.chatbot.model.ChatMessage;
import com.example.chatbot.model.ChatRequest;
import com.example.chatbot.model.ChatResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatService {

    // In-memory conversation history store (conversationId -> List of messages)
    private final Map<String, List<ChatMessage>> conversations = new ConcurrentHashMap<>();

    // Random instance for varied responses
    private final Random random = new Random();

    // Curated programming jokes
    private final List<String> jokes = List.of(
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "Why did the Java developer wear glasses? Because they didn't C#! 👓",
            "There are only 10 types of people in the world: those who understand binary, and those who don't. 💻",
            "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🍺",
            "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
            "How many programmers does it take to change a light bulb? None, that's a hardware problem. 💡",
            "A programmer's wife says: 'Go to the store and get a loaf of bread. If they have eggs, get a dozen.' The programmer returns with 12 loaves of bread. 🍞",
            "Debugging: Being the detective in a crime movie where you are also the murderer. 🕵️‍♂️"
    );

    // Curated fun tech facts
    private final List<String> funFacts = List.of(
            "The first computer bug was an actual real moth found trapped inside the Harvard Mark II computer in 1947 by Grace Hopper's team! 🦋",
            "Java was originally called 'Oak' after an oak tree that stood outside James Gosling's office at Sun Microsystems. ☕",
            "The very first 1GB hard drive was released by IBM in 1980. It weighed over 500 pounds and cost $40,000! 💾",
            "The word 'robot' comes from the Czech word 'robota', which means forced labor or drudgery. 🤖",
            "Over 90% of the world's currency exists only on computers as digital data! 💳"
    );

    // Curated motivational quotes
    private final List<String> quotes = List.of(
            "\"Any fool can write code that a computer can understand. Good programmers write code that humans can understand.\" — Martin Fowler",
            "\"First, solve the problem. Then, write the code.\" — John Johnson",
            "\"Experience is the name everyone gives to their mistakes.\" — Oscar Wilde",
            "\"Code is like humor. When you have to explain it, it’s bad.\" — Cory House",
            "\"Simplicity is prerequisite for reliability.\" — Edsger W. Dijkstra"
    );

    /**
     * Process an incoming user message and generate a structured response.
     */
    public ChatResponse processMessage(ChatRequest request) {
        String rawInput = request.getMessage() != null ? request.getMessage().trim() : "";
        String convId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : UUID.randomUUID().toString();
        String personality = request.getPersonality() != null ? request.getPersonality().toLowerCase() : "default";

        // Record user message
        recordMessage(convId, "user", rawInput);

        if (rawInput.isEmpty()) {
            String emptyReply = "It looks like your message was empty. Type something and I'll be happy to assist!";
            recordMessage(convId, "bot", emptyReply);
            return new ChatResponse(emptyReply, convId, List.of("What can you do?", "Tell me a joke", "Explain Java OOP"));
        }

        // Generate response based on patterns and rules
        ReplyWithSuggestions outcome = generateRuleBasedReply(rawInput, personality);

        // Record bot response
        recordMessage(convId, "bot", outcome.reply);

        return new ChatResponse(outcome.reply, convId, outcome.suggestions);
    }

    /**
     * Store message in conversation history.
     */
    private void recordMessage(String conversationId, String sender, String text) {
        conversations.computeIfAbsent(conversationId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(new ChatMessage(sender, text));
    }

    /**
     * Retrieve conversation history for a given ID.
     */
    public List<ChatMessage> getHistory(String conversationId) {
        return conversations.getOrDefault(conversationId, Collections.emptyList());
    }

    /**
     * Clear conversation history for a given ID.
     */
    public boolean clearHistory(String conversationId) {
        if (conversations.containsKey(conversationId)) {
            conversations.remove(conversationId);
            return true;
        }
        return false;
    }

    /**
     * Rule matching engine.
     */
    private ReplyWithSuggestions generateRuleBasedReply(String input, String personality) {
        String lower = input.toLowerCase();

        // 1. Math / Calculation queries
        ReplyWithSuggestions mathResult = tryEvaluateMath(input);
        if (mathResult != null) {
            return mathResult;
        }

        // 2. Date and Time queries
        if (matchesAny(lower, "what time", "current time", "what's the time", "time now", "tell me the time")) {
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a (EEEE)"));
            String reply = "🕒 The current server time is **" + timeStr + "**.";
            return new ReplyWithSuggestions(reply, List.of("What is today's date?", "Tell me a joke", "Java Hello World"));
        }

        if (matchesAny(lower, "what date", "today's date", "what is today", "what day is it", "current date")) {
            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            String reply = "📅 Today is **" + dateStr + "**.";
            return new ReplyWithSuggestions(reply, List.of("What time is it?", "Explain Spring Boot", "Tell me a fun fact"));
        }

        // 3. Greetings
        if (matchesAny(lower, "hello", "hi", "hey", "hola", "greetings", "good morning", "good evening", "good afternoon", "yo", "sup")) {
            String greeting;
            if ("friendly".equals(personality)) {
                greeting = "Hello there! ✨ Wonderful to see you. How can I make your day brighter or help with your projects?";
            } else if ("coder".equals(personality)) {
                greeting = "System online. Ready for queries. What programming or architecture topic are we debugging today?";
            } else {
                greeting = "Hello! 👋 I am your Spring Boot Chatbot. How can I assist you today?";
            }
            return new ReplyWithSuggestions(greeting, List.of(
                    "What can you do?",
                    "Explain Java OOP Concepts",
                    "How to build REST API in Spring Boot?",
                    "Tell me a programming joke"
            ));
        }

        // 4. Identity & Capabilities
        if (matchesAny(lower, "who are you", "what is your name", "what are you", "introduce yourself")) {
            String reply = "🤖 **Hello! I am NovaChat**, a modern full-stack chatbot powered by **Java & Spring Boot** on the backend and modern HTML5, CSS3, and JavaScript on the frontend.\n\n"
                    + "### What I can help you with:\n"
                    + "- ☕ **Java & Spring Boot**: Code examples, OOP concepts, REST APIs, multithreading.\n"
                    + "- 🌐 **Web Development**: HTML, CSS, JavaScript, frontend architectures.\n"
                    + "- 🧮 **Quick Calculations**: Try asking `calculate 45 * 12` or `sqrt(144)`.\n"
                    + "- ⏰ **Date & Time**: Real-time clock and calendar updates.\n"
                    + "- 💡 **Humor & Trivia**: Tech jokes and fun computing facts.\n\n"
                    + "Feel free to pick any prompt below or type your own question!";
            return new ReplyWithSuggestions(reply, List.of(
                    "Show me Java Hello World",
                    "Explain OOP concepts",
                    "Tell me a joke",
                    "What is a REST API?"
            ));
        }

        if (matchesAny(lower, "help", "commands", "features", "what can you do", "topics")) {
            String reply = "💡 **Here is what you can ask me:**\n\n"
                    + "| Category | Example Queries |\n"
                    + "| :--- | :--- |\n"
                    + "| **Java Concepts** | `Explain OOP concepts`, `List vs Set`, `What is Java` |\n"
                    + "| **Spring Boot** | `What is Spring Boot?`, `How to build REST API` |\n"
                    + "| **Code Snippets** | `Java Hello World`, `Exception handling in Java` |\n"
                    + "| **Math** | `What is 125 * 8?`, `calculate (50 + 25) / 5` |\n"
                    + "| **Date/Time** | `What time is it?`, `Today's date` |\n"
                    + "| **Fun & Games** | `Tell me a joke`, `Fun fact`, `Roll a dice`, `Flip a coin` |\n\n"
                    + "Type any topic or click one of the suggested buttons below!";
            return new ReplyWithSuggestions(reply, List.of(
                    "Explain Java OOP",
                    "What is Spring Boot?",
                    "Tell me a joke",
                    "Roll a dice"
            ));
        }

        // 5. How are you / Feelings
        if (matchesAny(lower, "how are you", "how's it going", "how do you do", "how are things")) {
            String reply = "I'm running smoothly with 0% memory leaks and 100% enthusiasm! ⚡ How can I assist you right now?";
            return new ReplyWithSuggestions(reply, List.of("Explain Spring Boot", "Tell me a joke", "What is Java?"));
        }

        // 6. Gratitude / Thanks
        if (matchesAny(lower, "thank you", "thanks", "thx", "appreciate it", "great job")) {
            String reply = "You're very welcome! 😊 Always glad to assist. Let me know if you need anything else!";
            return new ReplyWithSuggestions(reply, List.of("Explain REST API", "Tell me a fun fact", "Inspire me"));
        }

        // 7. Goodbye
        if (matchesAny(lower, "bye", "goodbye", "see you", "exit", "quit")) {
            String reply = "Goodbye! 👋 Have a productive day, and come back whenever you're ready to chat or code!";
            return new ReplyWithSuggestions(reply, List.of("Hello", "Help", "New Chat"));
        }

        // 8. Jokes & Fun
        if (matchesAny(lower, "joke", "funny", "make me laugh", "humor")) {
            String joke = jokes.get(random.nextInt(jokes.size()));
            return new ReplyWithSuggestions("😄 Here is one for you:\n\n" + joke,
                    List.of("Tell me another joke", "Tell me a fun fact", "Java Hello World"));
        }

        if (matchesAny(lower, "fun fact", "fact", "trivia")) {
            String fact = funFacts.get(random.nextInt(funFacts.size()));
            return new ReplyWithSuggestions("💡 **Did you know?**\n\n" + fact,
                    List.of("Another fun fact", "Tell me a joke", "Inspire me"));
        }

        if (matchesAny(lower, "quote", "inspire", "motivat")) {
            String quote = quotes.get(random.nextInt(quotes.size()));
            return new ReplyWithSuggestions("🌟 **Daily Inspiration:**\n\n" + quote,
                    List.of("Another quote", "Tell me a joke", "Explain OOP"));
        }

        if (matchesAny(lower, "roll a dice", "roll dice", "dice")) {
            int roll = random.nextInt(6) + 1;
            return new ReplyWithSuggestions("🎲 You rolled a **" + roll + "**!", List.of("Roll again", "Flip a coin", "Tell me a joke"));
        }

        if (matchesAny(lower, "flip a coin", "coin flip", "heads or tails")) {
            String result = random.nextBoolean() ? "Heads 🪙" : "Tails 🪙";
            return new ReplyWithSuggestions("🪙 The coin landed on: **" + result + "**!", List.of("Flip again", "Roll a dice", "Tell me a joke"));
        }

        // 9. Java & Programming Topics
        if (matchesAny(lower, "hello world", "write hello world", "java hello world")) {
            String reply = "Here is a classic **Hello World** application in Java:\n\n"
                    + "```java\n"
                    + "public class HelloWorld {\n"
                    + "    public static void main(String[] args) {\n"
                    + "        System.out.println(\"Hello, World!\");\n"
                    + "    }\n"
                    + "}\n"
                    + "```\n\n"
                    + "### How to compile and run:\n"
                    + "1. Save the file as `HelloWorld.java`\n"
                    + "2. Compile: `javac HelloWorld.java`\n"
                    + "3. Run: `java HelloWorld`";
            return new ReplyWithSuggestions(reply, List.of("Explain OOP concepts", "What is Spring Boot?", "List vs Set"));
        }

        if (matchesAny(lower, "what is java", "explain java", "about java")) {
            String reply = "☕ **Java** is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible.\n\n"
                    + "### Key Features:\n"
                    + "- **Platform Independence**: \"Write Once, Run Anywhere\" (WORA) via the Java Virtual Machine (JVM).\n"
                    + "- **Object-Oriented**: Everything is modeled around objects and classes.\n"
                    + "- **Automatic Memory Management**: Handled seamlessly by the Garbage Collector.\n"
                    + "- **Robust & Secure**: Strong type checking, exception handling, and bytecode verification.\n"
                    + "- **Huge Ecosystem**: Spring, Jakarta EE, Android, Apache Spark, and millions of libraries.";
            return new ReplyWithSuggestions(reply, List.of("What is Spring Boot?", "Explain OOP concepts", "List vs Set"));
        }

        if (matchesAny(lower, "oop", "object oriented", "encapsulation", "polymorphism", "inheritance", "abstraction")) {
            String reply = "🧱 **The 4 Core Pillars of Object-Oriented Programming (OOP) in Java:**\n\n"
                    + "1. **Encapsulation**:\n"
                    + "   - Bundling data (fields) and methods that operate on that data into a single unit (class), hiding internal details using `private` access.\n\n"
                    + "2. **Inheritance**:\n"
                    + "   - Mechanism where one class acquires properties of another using `extends` keyword (promotes code reuse).\n\n"
                    + "3. **Polymorphism**:\n"
                    + "   - Ability to take multiple forms. Manifests as **Method Overloading** (compile-time) and **Method Overriding** (runtime with `@Override`).\n\n"
                    + "4. **Abstraction**:\n"
                    + "   - Hiding complex implementation details and showing only essential features using `abstract` classes and `interface`s.";
            return new ReplyWithSuggestions(reply, List.of("What is Spring Boot?", "List vs Set", "Java Hello World"));
        }

        if (matchesAny(lower, "spring boot", "what is spring boot", "explain spring boot")) {
            String reply = "🍃 **Spring Boot** is an extension of the Spring framework designed to simplify the bootstrapping and development of production-ready Java applications.\n\n"
                    + "### Why Developers Love Spring Boot:\n"
                    + "- **Auto-Configuration**: Sensible defaults configure beans automatically based on classpath dependencies.\n"
                    + "- **Embedded Servers**: Comes with embedded Tomcat, Jetty, or Undertow—no separate WAR deployment required.\n"
                    + "- **Starter Dependencies**: Curated `spring-boot-starter-*` dependencies aggregate compatible versions.\n"
                    + "- **Production Readiness**: Built-in health checks, metrics, and externalized configuration via Actuator.";
            return new ReplyWithSuggestions(reply, List.of("How to build REST API", "What is a REST API?", "Explain OOP concepts"));
        }

        if (matchesAny(lower, "rest api", "what is rest", "restful", "explain rest")) {
            String reply = "🌐 **REST (Representational State Transfer)** is an architectural style for networked web applications communicating over HTTP.\n\n"
                    + "### Standard HTTP Methods:\n"
                    + "- `GET` : Retrieve resources (safe & idempotent)\n"
                    + "- `POST` : Create a new resource\n"
                    + "- `PUT` : Replace or update an entire existing resource\n"
                    + "- `PATCH` : Partially update an existing resource\n"
                    + "- `DELETE` : Remove a resource\n\n"
                    + "In Spring Boot, you create REST controllers using `@RestController`, `@GetMapping`, and `@PostMapping`.";
            return new ReplyWithSuggestions(reply, List.of("How to build REST API", "What is Spring Boot?", "Exception handling in Java"));
        }

        if (matchesAny(lower, "how to build rest api", "create rest api", "rest controller example")) {
            String reply = "Here is a clean Spring Boot REST controller example:\n\n"
                    + "```java\n"
                    + "@RestController\n"
                    + "@RequestMapping(\"/api/users\")\n"
                    + "public class UserController {\n\n"
                    + "    @GetMapping(\"/{id}\")\n"
                    + "    public ResponseEntity<User> getUser(@PathVariable Long id) {\n"
                    + "        User user = new User(id, \"Alex\");\n"
                    + "        return ResponseEntity.ok(user);\n"
                    + "    }\n\n"
                    + "    @PostMapping\n"
                    + "    public ResponseEntity<User> createUser(@RequestBody User user) {\n"
                    + "        return ResponseEntity.status(HttpStatus.CREATED).body(user);\n"
                    + "    }\n"
                    + "}\n"
                    + "```";
            return new ReplyWithSuggestions(reply, List.of("What is Spring Boot?", "Exception handling in Java", "Explain OOP"));
        }

        if (matchesAny(lower, "list vs set", "difference between list and set", "list and set")) {
            String reply = "📊 **Comparison: List vs Set in Java Collections**\n\n"
                    + "| Feature | `List` (e.g., ArrayList) | `Set` (e.g., HashSet) |\n"
                    + "| :--- | :--- | :--- |\n"
                    + "| **Duplicates** | Allowed ✅ | Disallowed ❌ |\n"
                    + "| **Order** | Preserves insertion order | Generally unordered (unless LinkedHashSet/TreeSet) |\n"
                    + "| **Positional Access** | By index: `get(index)` | No indexing support |\n"
                    + "| **Common Implementations** | `ArrayList`, `LinkedList` | `HashSet`, `TreeSet` |";
            return new ReplyWithSuggestions(reply, List.of("Explain OOP concepts", "What is multithreading?", "Tell me a joke"));
        }

        if (matchesAny(lower, "multithreading", "thread", "concurrency")) {
            String reply = "🧵 **Multithreading in Java** enables concurrent execution of two or more threads for maximum CPU utilization.\n\n"
                    + "### Creating a Thread:\n"
                    + "```java\n"
                    + "// Using Runnable lambda\n"
                    + "Thread thread = new Thread(() -> {\n"
                    + "    System.out.println(\"Running in thread: \" + Thread.currentThread().getName());\n"
                    + "});\n"
                    + "thread.start();\n"
                    + "```\n\n"
                    + "### Modern Best Practice:\n"
                    + "Always prefer `ExecutorService` or Virtual Threads (Java 21+) rather than creating raw `new Thread()` objects!";
            return new ReplyWithSuggestions(reply, List.of("What is Java?", "List vs Set", "Exception handling in Java"));
        }

        if (matchesAny(lower, "exception", "try catch", "error handling")) {
            String reply = "⚠️ **Exception Handling in Java** uses `try`, `catch`, `finally`, `throw`, and `throws`:\n\n"
                    + "```java\n"
                    + "try {\n"
                    + "    int result = 10 / 0;\n"
                    + "} catch (ArithmeticException e) {\n"
                    + "    System.err.println(\"Cannot divide by zero: \" + e.getMessage());\n"
                    + "} finally {\n"
                    + "    System.out.println(\"Cleanup code always executes.\");\n"
                    + "}\n"
                    + "```\n\n"
                    + "- **Checked Exceptions**: Checked at compile time (subclasses of `Exception` except `RuntimeException`).\n"
                    + "- **Unchecked Exceptions**: Occur at runtime (subclasses of `RuntimeException`, e.g. `NullPointerException`).";
            return new ReplyWithSuggestions(reply, List.of("Explain OOP concepts", "What is Spring Boot?", "Tell me a joke"));
        }

        // 10. Web Technologies (HTML, CSS, JS)
        if (matchesAny(lower, "what is html", "html")) {
            String reply = "📄 **HTML (HyperText Markup Language)** provides the semantic backbone and structural foundation of every web page.\n\n"
                    + "```html\n"
                    + "<!DOCTYPE html>\n"
                    + "<html>\n"
                    + "  <body>\n"
                    + "    <h1>Hello World</h1>\n"
                    + "    <p>Welcome to modern web development!</p>\n"
                    + "  </body>\n"
                    + "</html>\n"
                    + "```";
            return new ReplyWithSuggestions(reply, List.of("What is CSS?", "What is JavaScript?", "Frontend vs Backend"));
        }

        if (matchesAny(lower, "what is css", "css")) {
            String reply = "🎨 **CSS (Cascading Style Sheets)** describes how HTML elements are styled and presented visually across screen sizes.\n\n"
                    + "```css\n"
                    + ".chat-container {\n"
                    + "  display: flex;\n"
                    + "  flex-direction: column;\n"
                    + "  background: #1e1e2f;\n"
                    + "  color: #ffffff;\n"
                    + "  border-radius: 12px;\n"
                    + "}\n"
                    + "```\n\n"
                    + "Key features include Flexbox, CSS Grid, media queries, CSS variables, and transitions.";
            return new ReplyWithSuggestions(reply, List.of("What is JavaScript?", "What is HTML?", "Frontend vs Backend"));
        }

        if (matchesAny(lower, "what is javascript", "javascript", "js")) {
            String reply = "⚡ **JavaScript** is the dynamic programming language of the web that makes web pages interactive.\n\n"
                    + "```javascript\n"
                    + "fetch('http://localhost:8080/api/chat', {\n"
                    + "    method: 'POST',\n"
                    + "    headers: { 'Content-Type': 'application/json' },\n"
                    + "    body: JSON.stringify({ message: 'Hello' })\n"
                    + "})\n"
                    + ".then(res => res.json())\n"
                    + ".then(data => console.log(data.reply));\n"
                    + "```";
            return new ReplyWithSuggestions(reply, List.of("What is Spring Boot?", "Frontend vs Backend", "Tell me a joke"));
        }

        if (matchesAny(lower, "frontend vs backend", "fullstack", "full stack")) {
            String reply = "🏗️ **Frontend vs Backend Architecture**:\n\n"
                    + "- **Frontend (Client-Side)**: HTML, CSS, JavaScript running in the user's browser. Responsible for UI, responsiveness, animations, and user experience.\n"
                    + "- **Backend (Server-Side)**: Java Spring Boot running on the server. Responsible for business logic, database queries, authentication, security, and REST APIs.\n\n"
                    + "This chatbot demonstrates full-stack cohesion: the frontend communicates with the Java backend via HTTP JSON requests!";
            return new ReplyWithSuggestions(reply, List.of("What is Spring Boot?", "What is a REST API?", "Tell me a joke"));
        }

        // 11. Intelligent Fallback with Keyword Analysis
        String fallback = buildIntelligentFallback(input, personality);
        return new ReplyWithSuggestions(fallback, List.of(
                "What can you do?",
                "Explain Java OOP",
                "What is Spring Boot?",
                "Tell me a programming joke"
        ));
    }

    /**
     * Checks if input contains any of the target substrings.
     */
    private boolean matchesAny(String input, String... targets) {
        for (String target : targets) {
            if (input.contains(target)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Attempts to recognize and solve arithmetic queries.
     */
    private ReplyWithSuggestions tryEvaluateMath(String input) {
        String cleaned = input.toLowerCase()
                .replaceAll("what is", "")
                .replaceAll("calculate", "")
                .replaceAll("evaluate", "")
                .replaceAll("solve", "")
                .replaceAll("how much is", "")
                .replaceAll("\\?", "")
                .trim();

        // Pattern for square root: sqrt(number)
        Pattern sqrtPattern = Pattern.compile("sqrt\\s*\\(?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*\\)?");
        Matcher sqrtMatcher = sqrtPattern.matcher(cleaned);
        if (sqrtMatcher.find()) {
            try {
                double val = Double.parseDouble(sqrtMatcher.group(1));
                double res = Math.sqrt(val);
                String formatted = (res == Math.floor(res)) ? String.valueOf((long) res) : String.format("%.4f", res);
                return new ReplyWithSuggestions("🧮 **Calculation:** `√" + val + "` = **" + formatted + "**",
                        List.of("Calculate 15 * 8", "Tell me a joke", "Java Hello World"));
            } catch (Exception ignored) {
            }
        }

        // Pattern for binary arithmetic: number op number
        Pattern mathPattern = Pattern.compile("^(-?[0-9]+(?:\\.[0-9]+)?)\\s*([+\\-*/%^xX])\\s*(-?[0-9]+(?:\\.[0-9]+)?)$");
        Matcher matcher = mathPattern.matcher(cleaned);
        if (matcher.matches()) {
            try {
                double a = Double.parseDouble(matcher.group(1));
                String op = matcher.group(2).toLowerCase();
                double b = Double.parseDouble(matcher.group(3));
                double result;

                switch (op) {
                    case "+":
                        result = a + b;
                        break;
                    case "-":
                        result = a - b;
                        break;
                    case "*":
                    case "x":
                        result = a * b;
                        break;
                    case "/":
                        if (b == 0) {
                            return new ReplyWithSuggestions("⚠️ Division by zero is undefined in mathematics!",
                                    List.of("Calculate 100 / 4", "Tell me a joke", "Help"));
                        }
                        result = a / b;
                        break;
                    case "%":
                        result = a % b;
                        break;
                    case "^":
                        result = Math.pow(a, b);
                        break;
                    default:
                        return null;
                }

                String formatted = (result == Math.floor(result) && !Double.isInfinite(result))
                        ? String.valueOf((long) result)
                        : String.format("%.4f", result);

                String reply = "🧮 **Calculation:** `" + a + " " + op + " " + b + "` = **" + formatted + "**";
                return new ReplyWithSuggestions(reply, List.of("What is today's date?", "Explain Java OOP", "Tell me a joke"));
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    /**
     * Fallback for queries that don't match strict rules.
     */
    private String buildIntelligentFallback(String input, String personality) {
        if ("coder".equals(personality)) {
            return "No matching rule identified for query: `" + input + "`.\n\n"
                    + "Available commands: try asking about `Java`, `Spring Boot`, `OOP`, `REST API`, `Math`, or `Jokes`.";
        }

        return "That's an interesting question! While my current rule set doesn't have an exact pre-programmed answer for **\"" + input + "\"**, here are some related things I excel at:\n\n"
                + "- **Programming**: Ask me about Java, Spring Boot, OOP, or collections.\n"
                + "- **Code Examples**: Ask for \"Java Hello World\" or \"REST API example\".\n"
                + "- **Math & Calculations**: Type `45 * 8` or `sqrt(64)`.\n"
                + "- **Clock & Calendar**: Ask for current time or date.\n"
                + "- **Fun**: Ask for a joke or fun fact!";
    }

    /**
     * Helper record to carry response text and suggestion chips.
     */
    private static class ReplyWithSuggestions {
        final String reply;
        final List<String> suggestions;

        ReplyWithSuggestions(String reply, List<String> suggestions) {
            this.reply = reply;
            this.suggestions = suggestions;
        }
    }
}
