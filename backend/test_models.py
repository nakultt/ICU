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
    
    try:
        models = client.models.list()
        for m in models:
            if "embed" in m.name.lower():
                print(f"Model: {m.name} - Supported Methods: {m.supported_generation_methods}")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
