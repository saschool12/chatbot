package com.example.chatbot.model;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class ChatMessage {
    private String id;
    private String sender; // "user" or "bot"
    private String text;
    private String timestamp;

    public ChatMessage() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
    }

    public ChatMessage(String sender, String text) {
        this.id = UUID.randomUUID().toString();
        this.sender = sender;
        this.text = text;
        this.timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
