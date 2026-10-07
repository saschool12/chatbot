package com.example.chatbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChatbotApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatbotApplication.class, args);
        System.out.println("=================================================");
        System.out.println("🤖 Chatbot Backend is running at http://localhost:8080");
        System.out.println("💬 API Chat Endpoint: http://localhost:8080/api/chat");
        System.out.println("=================================================");
    }
}
