package com.example.chatbot.model;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class ChatResponse {
    private String reply;
    private String conversationId;
    private String timestamp;
    private String status;
    private List<String> suggestions;

    public ChatResponse() {
        this.timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        this.status = "success";
        this.suggestions = new ArrayList<>();
    }

    public ChatResponse(String reply, String conversationId) {
        this.reply = reply;
        this.conversationId = conversationId;
        this.timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        this.status = "success";
        this.suggestions = new ArrayList<>();
    }

    public ChatResponse(String reply, String conversationId, List<String> suggestions) {
        this.reply = reply;
        this.conversationId = conversationId;
        this.timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        this.status = "success";
        this.suggestions = suggestions != null ? suggestions : new ArrayList<>();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }
}
