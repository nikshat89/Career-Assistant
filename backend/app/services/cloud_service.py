# MIT License • Copyright (c) 2026 Pathfinder

import os
import json
import httpx
from httpx import Timeout
from typing import List, Dict, Optional, AsyncGenerator

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct"

def get_openrouter_api_key() -> str:
    return os.getenv("OPENROUTER_API_KEY", "").strip()

async def get_cloud_response_stream(
    messages: List[Dict[str, str]],
    user_api_key: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    api_key = user_api_key or get_openrouter_api_key()
    if not api_key:
        yield "Error: OPENROUTER_API_KEY not set."
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Career Counselling AI",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3,
        "stream": True,
    }

    timeout = Timeout(10.0, read=300.0, write=10.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            async with client.stream("POST", OPENROUTER_URL, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk_json = json.loads(data)
                            delta = chunk_json["choices"][0]["delta"].get("content", "") or ""
                            if delta:
                                yield delta
                        except:
                            pass
        except Exception as e:
            yield f"Cloud Error: {str(e)}"

async def get_cloud_response_nonstream(
    messages: List[Dict[str, str]],
    user_api_key: Optional[str] = None,
) -> str:
    api_key = user_api_key or get_openrouter_api_key()
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Career Counselling AI",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.3,
    }

    timeout = Timeout(10.0, read=120.0, write=10.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(OPENROUTER_URL, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()
