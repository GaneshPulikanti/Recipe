import os
import json
from datetime import datetime
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from recipe import create_recipegpt_chain

app = FastAPI(title="RecipeGPT API")

# Setup CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RECENTS_DIR = "recents"
os.makedirs(RECENTS_DIR, exist_ok=True)

# Global variables to hold our Langchain models
qa_chain = None

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None
    
class ChatResponse(BaseModel):
    answer: str
    chat_id: str

@app.on_event("startup")
def startup_event():
    global qa_chain
    print("Initializing RecipeGPT Chain...")
    try:
        qa_chain = create_recipegpt_chain()
        print("RecipeGPT Chain initialized successfully.")
    except Exception as e:
        print(f"Error initializing chain: {e}")

def get_chain():
    global qa_chain
    if not qa_chain:
        qa_chain = create_recipegpt_chain()
    if not qa_chain:
        raise HTTPException(status_code=500, detail="Chatbot is not initialized")
    return qa_chain

def generate_chat_title(user_message):
    title = user_message.strip().replace("\n", " ")
    if len(title) > 40:
        title = title[:40] + "..."
    return title or "Untitled Chat"

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    chain = get_chain()
    
    try:
        # 1. Generate answer from chain
        result = chain.invoke({"question": request.message})
        answer = result.get("answer", "I couldn't generate a response.")
        
        chat_id = request.chat_id
        
        # 2. Determine/Create file
        if not chat_id:
            # Create a new conversation file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            title = generate_chat_title(request.message)
            
            # Safe filename
            safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).strip()
            safe_title = safe_title.replace(" ", "_")
            
            filename = f"{timestamp}_{safe_title}.json"
            chat_id = filename
            
            conversation = [{"user": request.message, "assistant": answer}]
        else:
            # Load existing conversation
            file_path = os.path.join(RECENTS_DIR, chat_id)
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                conversation = data.get("conversation", [])
                conversation.append({"user": request.message, "assistant": answer})
            else:
                conversation = [{"user": request.message, "assistant": answer}]
        
        # 3. Save conversation
        data = {
            "timestamp": datetime.now().isoformat(),
            "title": generate_chat_title(conversation[0]["user"]),
            "conversation": conversation
        }
        
        file_path = os.path.join(RECENTS_DIR, chat_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
            
        return ChatResponse(answer=answer, chat_id=chat_id)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history():
    files = []
    for filename in os.listdir(RECENTS_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(RECENTS_DIR, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                files.append({
                    "id": filename,
                    "title": data.get("title") or filename,
                    "timestamp": data.get("timestamp")
                })
            except Exception:
                continue
    # Sort by timestamp/filename descending
    files.sort(key=lambda x: x.get("id", ""), reverse=True)
    return files

@app.get("/api/chat/load")
async def load_chat(chat_id: str):
    chain = get_chain()
    file_path = os.path.join(RECENTS_DIR, chat_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Chat not found")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        conversation = data.get("conversation", [])
        
        # Restore LangChain memory
        chain.memory.clear()
        for turn in conversation:
            chain.memory.chat_memory.add_user_message(turn["user"])
            chain.memory.chat_memory.add_ai_message(turn["assistant"])
            
        # Format messages for frontend
        formatted_messages = []
        for turn in conversation:
            formatted_messages.append({"role": "user", "content": turn["user"]})
            formatted_messages.append({"role": "assistant", "content": turn["assistant"]})
            
        return {
            "chat_id": chat_id,
            "title": data.get("title"),
            "messages": formatted_messages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/delete/{chat_id}")
async def delete_chat(chat_id: str):
    file_path = os.path.join(RECENTS_DIR, chat_id)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            # Clear memory if we just deleted the current active conversation
            chain = get_chain()
            chain.memory.clear()
            return {"status": "success", "message": f"Deleted chat {chat_id}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Chat not found")

@app.delete("/api/chat/clear")
async def clear_memory():
    chain = get_chain()
    if chain and chain.memory:
        chain.memory.clear()
        return {"status": "memory cleared"}
    return {"status": "no memory to clear"}

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
