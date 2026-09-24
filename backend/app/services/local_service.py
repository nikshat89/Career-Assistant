# MIT License • Copyright (c) 2026 Pathfinder

import os
from openai import AsyncOpenAI
from typing import List, Dict, Optional, AsyncGenerator

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "careerboost-exaone")

openai_client = AsyncOpenAI(base_url=LM_STUDIO_URL, api_key="lm-studio")

async def get_local_response_stream(
    messages: List[Dict[str, str]],
) -> AsyncGenerator[str, None]:
    try:
        response = await openai_client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.3,
            stream=True,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta
    except Exception as e:
        yield f"Local Error: {str(e)}"

async def get_local_response_nonstream(
    messages: List[Dict[str, str]],
) -> str:
    response = await openai_client.chat.completions.create(
        model=LM_STUDIO_MODEL,
        messages=messages,
        max_tokens=1024,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()
