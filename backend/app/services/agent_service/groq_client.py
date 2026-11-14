import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
FAST_GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqClient:
    """
    Lightweight, zero-dependency Groq API Client for IATS.
    
    Optimized for the Groq Free Tier:
    - Default Model: `llama-3.3-70b-versatile` (high reasoning capability, 128k context)
    - Fast Model: `llama-3.1-8b-instant` (ultra-low latency)
    - Fallback: Uses Python's native `urllib.request` if the `groq` package is not installed.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: int = 30
    ):
        self.api_key = (api_key or os.getenv("GROQ_API_KEY", "")).strip()
        self.model = model or os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL)
        self.timeout = timeout
        self._sdk_client = None

        # Check if the optional `groq` SDK is available in the environment
        try:
            from groq import Groq
            if self.api_key:
                self._sdk_client = Groq(api_key=self.api_key)
        except ImportError:
            self._sdk_client = None

    @property
    def is_configured(self) -> bool:
        """Returns True if a non-placeholder Groq API key is present."""
        return bool(self.api_key and not self.api_key.startswith("your-") and len(self.api_key) > 10)

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        json_mode: bool = False,
    ) -> str:
        """
        Send a chat completion request to Groq API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'.
            system_prompt: Optional system instructions prepended to messages.
            temperature: Sampling temperature (0.0 - 1.0, 0.2 recommended for deterministic academic output).
            max_tokens: Maximum completion tokens.
            json_mode: When True, prompts the model to return valid JSON object.
            
        Returns:
            The model's assistant response text.
        """
        if not self.is_configured:
            raise ValueError(
                "GROQ_API_KEY is not configured or invalid. "
                "Set GROQ_API_KEY in your .env file or obtain one free at https://console.groq.com"
            )

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        # 1. Use the official SDK if installed
        if self._sdk_client is not None:
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": formatted_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            chat_completion = self._sdk_client.chat.completions.create(**kwargs)
            return chat_completion.choices[0].message.content or ""

        # 2. Native urllib fallback (zero external dependencies required)
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "IATS-AcademicAgent/1.0",
        }

        req = urllib.request.Request(
            GROQ_API_URL,
            data=data_bytes,
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                choices = res_json.get("choices", [])
                if not choices:
                    raise ValueError("Groq API returned an empty choices array.")
                return choices[0].get("message", {}).get("content", "")

        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8", errors="ignore")
            if err.code == 401:
                raise ValueError(f"Groq API authentication failed (401 Unauthorized): {err_body}") from err
            elif err.code == 429:
                raise RuntimeError(
                    f"Groq Free Tier rate limit exceeded (429 Too Many Requests). "
                    f"Please wait a moment before retrying. Details: {err_body}"
                ) from err
            else:
                raise RuntimeError(f"Groq API error HTTP {err.code}: {err_body}") from err

        except urllib.error.URLError as err:
            raise ConnectionError(f"Failed to connect to Groq API ({GROQ_API_URL}): {err.reason}") from err
