/**
 * Vercel Serverless Function: /api/chat
 * Provides seamless cloud chatbot functionality when deployed on Vercel.
 */

const jokes = [
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
  "Why did the Java developer wear glasses? Because they didn't C#! 👓",
  "There are only 10 types of people in the world: those who understand binary, and those who don't. 💻",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?' 🍺",
  "Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25! 🎃🎄",
  "How many programmers does it take to change a light bulb? None, that's a hardware problem. 💡",
  "A programmer's wife says: 'Go to the store and get a loaf of bread. If they have eggs, get a dozen.' The programmer returns with 12 loaves of bread. 🍞",
  "Debugging: Being the detective in a crime movie where you are also the murderer. 🕵️‍♂️"
];

const funFacts = [
  "The first computer bug was an actual real moth found trapped inside the Harvard Mark II computer in 1947 by Grace Hopper's team! 🦋",
  "Java was originally called 'Oak' after an oak tree that stood outside James Gosling's office at Sun Microsystems. ☕",
  "The very first 1GB hard drive was released by IBM in 1980. It weighed over 500 pounds and cost $40,000! 💾",
  "The word 'robot' comes from the Czech word 'robota', which means forced labor or drudgery. 🤖",
  "Over 90% of the world's currency exists only on computers as digital data! 💳"
];

const quotes = [
  "\"Any fool can write code that a computer can understand. Good programmers write code that humans can understand.\" — Martin Fowler",
  "\"First, solve the problem. Then, write the code.\" — John Johnson",
  "\"Experience is the name everyone gives to their mistakes.\" — Oscar Wilde",
  "\"Code is like humor. When you have to explain it, it’s bad.\" — Cory House",
  "\"Simplicity is prerequisite for reliability.\" — Edsger W. Dijkstra"
];

function tryEvaluateMath(input) {
  const cleaned = input.toLowerCase()
    .replace(/what is/g, '')
    .replace(/calculate/g, '')
    .replace(/evaluate/g, '')
    .replace(/solve/g, '')
    .replace(/how much is/g, '')
    .replace(/\?/g, '')
    .trim();

  // Square root
  const sqrtMatch = cleaned.match(/sqrt\s*\(?\s*([0-9]+(?:\.[0-9]+)?)\s*\)?/);
  if (sqrtMatch) {
    const val = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(val);
    const formatted = Number.isInteger(res) ? res : res.toFixed(4);
    return {
      reply: `🧮 **Calculation:** \`√${val}\` = **${formatted}**`,
      suggestions: ["Calculate 15 * 8", "Tell me a joke", "Java Hello World"]
    };
  }

  // Arithmetic: a op b
  const mathMatch = cleaned.match(/^(-?[0-9]+(?:\.[0-9]+)?)\s*([+\-*/%^xX])\s*(-?[0-9]+(?:\.[0-9]+)?)$/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const b = parseFloat(mathMatch[3]);
    let result = 0;

    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*':
      case 'x': result = a * b; break;
      case '/':
        if (b === 0) {
          return {
            reply: "⚠️ Division by zero is undefined in mathematics!",
            suggestions: ["Calculate 100 / 4", "Tell me a joke", "Help"]
          };
        }
        result = a / b;
        break;
      case '%': result = a % b; break;
      case '^': result = Math.pow(a, b); break;
      default: return null;
    }

    const formatted = Number.isInteger(result) ? result : result.toFixed(4);
    return {
      reply: `🧮 **Calculation:** \`${a} ${op} ${b}\` = **${formatted}**`,
      suggestions: ["What is today's date?", "Explain Java OOP", "Tell me a joke"]
    };
  }
  return null;
}

function processMessage(message, conversationId, personality = 'default') {
  const rawInput = (message || '').trim();
  const lower = rawInput.toLowerCase();
  const convId = conversationId || 'conv_' + Date.now();

  if (!rawInput) {
    return {
      reply: "It looks like your message was empty. Type something and I'll be happy to assist!",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["What can you do?", "Tell me a joke", "Explain Java OOP"]
    };
  }

  // 1. Math
  const mathResult = tryEvaluateMath(rawInput);
  if (mathResult) {
    return {
      reply: mathResult.reply,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: mathResult.suggestions
    };
  }

  // 2. Date and Time
  if (lower.includes('what time') || lower.includes('current time') || lower.includes("what's the time") || lower.includes('tell me the time')) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      reply: `🕒 The current server time is **${timeStr}**.`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["What is today's date?", "Tell me a joke", "Java Hello World"]
    };
  }

  if (lower.includes('what date') || lower.includes("today's date") || lower.includes('what day is it') || lower.includes('current date')) {
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return {
      reply: `📅 Today is **${dateStr}**.`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["What time is it?", "Explain Spring Boot", "Tell me a fun fact"]
    };
  }

  // 3. Greetings
  if (['hello', 'hi', 'hey', 'hola', 'greetings', 'good morning', 'good evening', 'good afternoon', 'yo', 'sup'].some(g => lower.includes(g))) {
    let greeting = "Hello! 👋 I am your Chatbot. How can I assist you today?";
    if (personality === 'friendly') {
      greeting = "Hello there! ✨ Wonderful to see you. How can I make your day brighter or help with your projects?";
    } else if (personality === 'coder') {
      greeting = "System online. Ready for queries. What programming or architecture topic are we debugging today?";
    }
    return {
      reply: greeting,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: [
        "What can you do?",
        "Explain Java OOP Concepts",
        "How to build REST API in Spring Boot?",
        "Tell me a programming joke"
      ]
    };
  }

  // 4. Identity & Help
  if (lower.includes('who are you') || lower.includes('what is your name') || lower.includes('introduce yourself')) {
    return {
      reply: "🤖 **Hello! I am NovaChat**, a modern full-stack chatbot designed with a **Java Spring Boot backend** and modern responsive HTML5, CSS3, and JavaScript frontend.\n\n"
        + "### What I can help you with:\n"
        + "- ☕ **Java & Spring Boot**: Code examples, OOP concepts, REST APIs, multithreading.\n"
        + "- 🌐 **Web Development**: HTML, CSS, JavaScript, frontend architectures.\n"
        + "- 🧮 **Quick Calculations**: Try asking `calculate 45 * 12` or `sqrt(144)`.\n"
        + "- ⏰ **Date & Time**: Real-time clock and calendar updates.\n"
        + "- 💡 **Humor & Trivia**: Tech jokes and fun computing facts.\n\n"
        + "Feel free to pick any prompt below or type your own question!",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Show me Java Hello World", "Explain OOP concepts", "Tell me a joke", "What is a REST API?"]
    };
  }

  if (lower.includes('help') || lower.includes('what can you do') || lower.includes('commands') || lower.includes('topics')) {
    return {
      reply: "💡 **Here is what you can ask me:**\n\n"
        + "| Category | Example Queries |\n"
        + "| :--- | :--- |\n"
        + "| **Java Concepts** | `Explain OOP concepts`, `List vs Set`, `What is Java` |\n"
        + "| **Spring Boot** | `What is Spring Boot?`, `How to build REST API` |\n"
        + "| **Code Snippets** | `Java Hello World`, `Exception handling in Java` |\n"
        + "| **Math** | `What is 125 * 8?`, `calculate (50 + 25) / 5` |\n"
        + "| **Date/Time** | `What time is it?`, `Today's date` |\n"
        + "| **Fun & Games** | `Tell me a joke`, `Fun fact`, `Roll a dice`, `Flip a coin` |\n\n"
        + "Type any topic or click one of the suggested buttons below!",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Explain Java OOP", "What is Spring Boot?", "Tell me a joke", "Roll a dice"]
    };
  }

  // 5. Jokes & Fun
  if (lower.includes('joke') || lower.includes('funny') || lower.includes('humor')) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return {
      reply: `😄 Here is one for you:\n\n${joke}`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Tell me another joke", "Tell me a fun fact", "Java Hello World"]
    };
  }

  if (lower.includes('fun fact') || lower.includes('fact') || lower.includes('trivia')) {
    const fact = funFacts[Math.floor(Math.random() * funFacts.length)];
    return {
      reply: `💡 **Did you know?**\n\n${fact}`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Another fun fact", "Tell me a joke", "Inspire me"]
    };
  }

  if (lower.includes('quote') || lower.includes('inspire') || lower.includes('motivat')) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      reply: `🌟 **Daily Inspiration:**\n\n${quote}`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Another quote", "Tell me a joke", "Explain OOP"]
    };
  }

  if (lower.includes('roll a dice') || lower.includes('roll dice') || lower.includes('dice')) {
    const roll = Math.floor(Math.random() * 6) + 1;
    return {
      reply: `🎲 You rolled a **${roll}**!`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Roll again", "Flip a coin", "Tell me a joke"]
    };
  }

  if (lower.includes('flip a coin') || lower.includes('coin flip') || lower.includes('heads or tails')) {
    const res = Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙";
    return {
      reply: `🪙 The coin landed on: **${res}**!`,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Flip again", "Roll a dice", "Tell me a joke"]
    };
  }

  // 6. Java Programming Topics
  if (lower.includes('hello world')) {
    return {
      reply: "Here is a classic **Hello World** application in Java:\n\n"
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
        + "3. Run: `java HelloWorld`",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["Explain OOP concepts", "What is Spring Boot?", "List vs Set"]
    };
  }

  if (lower.includes('what is java') || lower.includes('explain java') || lower.includes('about java')) {
    return {
      reply: "☕ **Java** is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible.\n\n"
        + "### Key Features:\n"
        + "- **Platform Independence**: \"Write Once, Run Anywhere\" (WORA) via the Java Virtual Machine (JVM).\n"
        + "- **Object-Oriented**: Everything is modeled around objects and classes.\n"
        + "- **Automatic Memory Management**: Handled seamlessly by the Garbage Collector.\n"
        + "- **Robust & Secure**: Strong type checking, exception handling, and bytecode verification.\n"
        + "- **Huge Ecosystem**: Spring, Jakarta EE, Android, Apache Spark, and millions of libraries.",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["What is Spring Boot?", "Explain OOP concepts", "List vs Set"]
    };
  }

  if (lower.includes('oop') || lower.includes('object oriented') || lower.includes('encapsulation') || lower.includes('polymorphism') || lower.includes('inheritance')) {
    return {
      reply: "🧱 **The 4 Core Pillars of Object-Oriented Programming (OOP) in Java:**\n\n"
        + "1. **Encapsulation**:\n"
        + "   - Bundling data (fields) and methods that operate on that data into a single unit (class), hiding internal details using `private` access.\n\n"
        + "2. **Inheritance**:\n"
        + "   - Mechanism where one class acquires properties of another using `extends` keyword (promotes code reuse).\n\n"
        + "3. **Polymorphism**:\n"
        + "   - Ability to take multiple forms. Manifests as **Method Overloading** (compile-time) and **Method Overriding** (runtime with `@Override`).\n\n"
        + "4. **Abstraction**:\n"
        + "   - Hiding complex implementation details and showing only essential features using `abstract` classes and `interface`s.",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["What is Spring Boot?", "List vs Set", "Java Hello World"]
    };
  }

  if (lower.includes('spring boot') || lower.includes('what is spring')) {
    return {
      reply: "🍃 **Spring Boot** is an extension of the Spring framework designed to simplify the bootstrapping and development of production-ready Java applications.\n\n"
        + "### Why Developers Love Spring Boot:\n"
        + "- **Auto-Configuration**: Sensible defaults configure beans automatically based on classpath dependencies.\n"
        + "- **Embedded Servers**: Comes with embedded Tomcat, Jetty, or Undertow—no separate WAR deployment required.\n"
        + "- **Starter Dependencies**: Curated `spring-boot-starter-*` dependencies aggregate compatible versions.\n"
        + "- **Production Readiness**: Built-in health checks, metrics, and externalized configuration via Actuator.",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["How to build REST API", "What is a REST API?", "Explain OOP concepts"]
    };
  }

  if (lower.includes('rest api') || lower.includes('what is rest')) {
    return {
      reply: "🌐 **REST (Representational State Transfer)** is an architectural style for networked web applications communicating over HTTP.\n\n"
        + "### Standard HTTP Methods:\n"
        + "- `GET` : Retrieve resources (safe & idempotent)\n"
        + "- `POST` : Create a new resource\n"
        + "- `PUT` : Replace or update an entire existing resource\n"
        + "- `PATCH` : Partially update an existing resource\n"
        + "- `DELETE` : Remove a resource\n\n"
        + "In Spring Boot, you create REST controllers using `@RestController`, `@GetMapping`, and `@PostMapping`.",
      conversationId: convId,
      timestamp: new Date().toISOString(),
      status: "success",
      suggestions: ["How to build REST API", "What is Spring Boot?", "Exception handling in Java"]
    };
  }

  // Fallback
  return {
    reply: `That's an interesting question! While my current rule set doesn't have an exact pre-programmed answer for **"${rawInput}"**, here are some related topics I excel at:\n\n`
      + "- **Programming**: Ask me about Java, Spring Boot, OOP, or collections.\n"
      + "- **Code Examples**: Ask for \"Java Hello World\" or \"REST API example\".\n"
      + "- **Math & Calculations**: Type `45 * 8` or `sqrt(64)`.\n"
      + "- **Clock & Calendar**: Ask for current time or date.\n"
      + "- **Fun**: Ask for a joke or fun fact!",
    conversationId: convId,
    timestamp: new Date().toISOString(),
    status: "success",
    suggestions: ["What can you do?", "Explain Java OOP", "What is Spring Boot?", "Tell me a programming joke"]
  };
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Health check support
    return res.status(200).json({
      status: 'UP',
      service: 'NovaChat Cloud Serverless API',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const { message, conversationId, personality } = req.body || {};
    const result = processMessage(message, conversationId, personality);
    return res.status(200).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
