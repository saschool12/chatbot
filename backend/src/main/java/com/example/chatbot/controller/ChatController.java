package com.example.chatbot.controller;

import com.example.chatbot.model.ChatMessage;
import com.example.chatbot.model.ChatRequest;
import com.example.chatbot.model.ChatResponse;
import com.example.chatbot.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(originPatterns = "*")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * POST /api/chat
     * Receives user message, processes it, and returns the bot's JSON response.
     */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        ChatResponse response = chatService.processMessage(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/chat/history?conversationId=xyz
     * Retrieves stored messages for the session.
     */
    @GetMapping("/history")
    public ResponseEntity<List<ChatMessage>> getHistory(@RequestParam String conversationId) {
        List<ChatMessage> history = chatService.getHistory(conversationId);
        return ResponseEntity.ok(history);
    }

    /**
     * POST /api/chat/clear?conversationId=xyz
     * Clears history for the given session.
     */
    @PostMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearChat(@RequestParam String conversationId) {
        boolean cleared = chatService.clearHistory(conversationId);
        Map<String, Object> res = new HashMap<>();
        res.put("cleared", cleared);
        res.put("conversationId", conversationId);
        res.put("status", "success");
        return ResponseEntity.ok(res);
    }

    /**
     * GET /api/chat/health
     * Health check endpoint to verify backend status.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Spring Boot Chatbot");
        health.put("javaVersion", System.getProperty("java.version"));
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }
}
