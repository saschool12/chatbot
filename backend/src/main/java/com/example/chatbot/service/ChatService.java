package com.example.chatbot.service;

import com.example.chatbot.model.ChatMessage;
import com.example.chatbot.model.ChatRequest;
import com.example.chatbot.model.ChatResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String defaultApiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // In-memory conversation history store
    private final Map<String, List<ChatMessage>> conversations = new ConcurrentHashMap<>();
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

    private final List<String> funFacts = List.of(
            "The first computer bug was an actual real moth found trapped inside the Harvard Mark II computer in 1947 by Grace Hopper's team! 🦋",
            "Java was originally called 'Oak' after an oak tree that stood outside James Gosling's office at Sun Microsystems. ☕",
            "The very first 1GB hard drive was released by IBM in 1980. It weighed over 500 pounds and cost $40,000! 💾",
            "The word 'robot' comes from the Czech word 'robota', which means forced labor or drudgery. 🤖",
            "Over 90% of the world's currency exists only on computers as digital data! 💳"
    );

    /**
     * Process message: Try Gemini AI first, fallback to rule-based engine if unavailable.
     */
    public ChatResponse processMessage(ChatRequest request) {
        String rawInput = request.getMessage() != null ? request.getMessage().trim() : "";
        String convId = (request.getConversationId() != null && !request.getConversationId().isBlank())
                ? request.getConversationId()
                : UUID.randomUUID().toString();
        String personality = request.getPersonality() != null ? request.getPersonality().toLowerCase() : "default";

        // Determine effective API key
        String effectiveKey = (request.getApiKey() != null && !request.getApiKey().isBlank())
                ? request.getApiKey().trim()
                : defaultApiKey;

        // Record user message
        recordMessage(convId, "user", rawInput);

        if (rawInput.isEmpty()) {
            String emptyReply = "It looks like your message was empty. Type something and I'll be happy to assist!";
            recordMessage(convId, "bot", emptyReply);
            return new ChatResponse(emptyReply, convId, List.of("What can you do?", "Tell me a joke", "Explain Java OOP"));
        }

        // 1. Try Gemini AI
        if (effectiveKey != null && !effectiveKey.isBlank()) {
            try {
                String aiReply = callGeminiAI(rawInput, personality, effectiveKey);
                if (aiReply != null && !aiReply.isBlank()) {
                    recordMessage(convId, "bot", aiReply);
                    List<String> suggestions = generateContextualSuggestions(rawInput);
                    return new ChatResponse(aiReply, convId, suggestions);
                }
            } catch (Exception e) {
                logger.warn("Gemini AI invocation failed, falling back to rule engine: {}", e.getMessage());
            }
        }

        // 2. Rule-based Fallback
        ReplyWithSuggestions outcome = generateRuleBasedReply(rawInput, personality);
        recordMessage(convId, "bot", outcome.reply);
        return new ChatResponse(outcome.reply, convId, outcome.suggestions);
    }

    /**
     * Calls Google Gemini Generative Language API
     */
    private String callGeminiAI(String userInput, String personality, String apiKey) throws Exception {
        String systemPrompt = switch (personality) {
            case "coder" -> "You are NovaChat, a world-class senior software engineer and Java architect. Provide clear, accurate, idiomatic code examples with markdown formatting. Explain deep architectural principles and best practices.";
            case "friendly" -> "You are NovaChat, a warm, positive, and cheerful AI assistant. Use friendly language and emojis while providing thoroughly accurate answers.";
            case "concise" -> "You are NovaChat, a highly concise and direct AI assistant. Provide bullet points and direct answers without unnecessary filler.";
            default -> "You are NovaChat, a modern and intelligent AI assistant powered by Java Spring Boot and Google Gemini. Be helpful, clear, and insightful. Format code snippets in markdown with language tags.";
        };

        // Construct request payload
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
        ));
        payload.put("contents", List.of(
                Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userInput))
                )
        ));

        String requestJson = objectMapper.writeValueAsString(payload);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        } else {
            logger.warn("Gemini API returned status {}: {}", response.statusCode(), response.body());
        }

        return null;
    }

    private List<String> generateContextualSuggestions(String query) {
        String lower = query.toLowerCase();
        if (lower.contains("java") || lower.contains("code") || lower.contains("spring")) {
            return List.of("Show code example", "Explain best practices", "How to optimize this?", "Tell me a joke");
        } else if (lower.contains("math") || lower.contains("calculate")) {
            return List.of("Calculate 125 * 8", "Explain the formula", "Tell me a fun fact");
        }
        return List.of("Tell me more", "Can you give an example?", "Explain simply", "Next question");
    }

    private void recordMessage(String conversationId, String sender, String text) {
        conversations.computeIfAbsent(conversationId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(new ChatMessage(sender, text));
    }

    public List<ChatMessage> getHistory(String conversationId) {
        return conversations.getOrDefault(conversationId, Collections.emptyList());
    }

    public boolean clearHistory(String conversationId) {
        if (conversations.containsKey(conversationId)) {
            conversations.remove(conversationId);
            return true;
        }
        return false;
    }

    /**
     * Rule-based engine fallback
     */
    private ReplyWithSuggestions generateRuleBasedReply(String input, String personality) {
        String lower = input.toLowerCase();

        ReplyWithSuggestions mathResult = tryEvaluateMath(input);
        if (mathResult != null) return mathResult;

        if (matchesAny(lower, "what time", "current time", "what's the time", "time now")) {
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a (EEEE)"));
            return new ReplyWithSuggestions("🕒 The current server time is **" + timeStr + "**.",
                    List.of("What is today's date?", "Tell me a joke", "Java Hello World"));
        }

        if (matchesAny(lower, "what date", "today's date", "what is today", "what day is it")) {
            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            return new ReplyWithSuggestions("📅 Today is **" + dateStr + "**.",
                    List.of("What time is it?", "Explain Spring Boot", "Tell me a fun fact"));
        }

        if (matchesAny(lower, "hello", "hi", "hey", "hola", "greetings", "good morning")) {
            return new ReplyWithSuggestions("Hello! 👋 I am NovaChat, powered by **Gemini AI** and **Java Spring Boot**. How can I help you today?",
                    List.of("Explain quantum computing", "Write Java code for me", "Tell me a joke", "How does Spring Boot work?"));
        }

        if (matchesAny(lower, "joke", "funny")) {
            return new ReplyWithSuggestions("😄 " + jokes.get(random.nextInt(jokes.size())),
                    List.of("Another joke", "Fun fact", "Inspire me"));
        }

        if (matchesAny(lower, "fun fact", "fact")) {
            return new ReplyWithSuggestions("💡 **Did you know?**\n\n" + funFacts.get(random.nextInt(funFacts.size())),
                    List.of("Another fact", "Tell me a joke", "Java Hello World"));
        }

        return new ReplyWithSuggestions("I'm ready to answer any question! Try asking about code, science, math, history, or anything else you'd like to explore.",
                List.of("Explain Java OOP", "What is Spring Boot?", "Calculate 25 * 16", "Tell me a joke"));
    }

    private boolean matchesAny(String input, String... targets) {
        for (String target : targets) {
            if (input.contains(target)) return true;
        }
        return false;
    }

    private ReplyWithSuggestions tryEvaluateMath(String input) {
        String cleaned = input.toLowerCase()
                .replaceAll("what is", "")
                .replaceAll("calculate", "")
                .replaceAll("\\?", "")
                .trim();

        Pattern mathPattern = Pattern.compile("^(-?[0-9]+(?:\\.[0-9]+)?)\\s*([+\\-*/%^xX])\\s*(-?[0-9]+(?:\\.[0-9]+)?)$");
        Matcher matcher = mathPattern.matcher(cleaned);
        if (matcher.matches()) {
            try {
                double a = Double.parseDouble(matcher.group(1));
                String op = matcher.group(2).toLowerCase();
                double b = Double.parseDouble(matcher.group(3));
                double result;
                switch (op) {
                    case "+": result = a + b; break;
                    case "-": result = a - b; break;
                    case "*":
                    case "x": result = a * b; break;
                    case "/":
                        if (b == 0) return new ReplyWithSuggestions("⚠️ Division by zero is undefined!", List.of("100 / 4", "Tell me a joke"));
                        result = a / b;
                        break;
                    default: return null;
                }
                String formatted = (result == Math.floor(result) && !Double.isInfinite(result))
                        ? String.valueOf((long) result)
                        : String.format("%.4f", result);
                return new ReplyWithSuggestions("🧮 **Calculation:** `" + a + " " + op + " " + b + "` = **" + formatted + "**",
                        List.of("Calculate 125 * 8", "Tell me a joke", "Explain OOP"));
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static class ReplyWithSuggestions {
        final String reply;
        final List<String> suggestions;
        ReplyWithSuggestions(String reply, List<String> suggestions) {
            this.reply = reply;
            this.suggestions = suggestions;
        }
    }
}
