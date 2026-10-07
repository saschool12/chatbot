package com.example.chatbot.model;

public class ChatRequest {
    private String message;
    private String conversationId;
    private String personality;

    public ChatRequest() {
    }

    public ChatRequest(String message, String conversationId, String personality) {
        this.message = message;
        this.conversationId = conversationId;
        this.personality = personality;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getPersonality() {
        return personality;
    }

    public void setPersonality(String personality) {
        this.personality = personality;
    }

    @Override
    public String toString() {
        return "ChatRequest{" +
                "message='" + message + '\'' +
                ", conversationId='" + conversationId + '\'' +
                ", personality='" + personality + '\'' +
                '}';
    }
}
