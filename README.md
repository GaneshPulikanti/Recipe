---
title: RecipeGPT Backend
emoji: 🍳
colorFrom: green
colorTo: yellow
sdk: docker
pinned: false
---

# RecipeGPT Backend API

A FastAPI backend for RecipeGPT — an AI-powered recipe chatbot using LangChain, FAISS, and Groq LLM.

## Endpoints

- `POST /api/chat` — Send a message and get a recipe recommendation
- `GET /api/history` — Get chat history list
- `GET /api/chat/load?chat_id=...` — Load a specific chat
- `DELETE /api/chat/delete/{chat_id}` — Delete a specific chat
- `DELETE /api/chat/clear` — Clear conversation memory

## Environment Variables

Set the following secret in your HF Space settings:

- `GROQ_API_KEY` — Your Groq API key
