import os
import asyncio
from typing import Optional

def load_env() -> Optional[str]:
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    return line.strip().split("=", 1)[1]
    except Exception:
        pass
    return None

async def test():
    key = load_env()
    if not key:
        print("NO KEY")
        return
    
    from google import genai
    client = genai.Client(api_key=key)
    
    models_to_test = [
        "text-embedding-004",
        "models/text-embedding-004",
        "embedding-001",
        "models/embedding-001"
    ]
    
    for m in models_to_test:
        try:
            res = client.models.embed_content(model=m, contents="hello")
            print(f"SUCCESS: {m} - Len: {len(res.embeddings[0].values)}")
        except Exception as e:
            print(f"FAILED: {m} - Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
