import logging
import anthropic
import httpx
from app.config import settings
from app.ai.prompt_builder import PromptBuilder
from app.ai.response_cache import AIResponseCache

logger = logging.getLogger(__name__)

# Anthropic client — lazily initialised, only used when ai_provider=claude
_anthropic_client: anthropic.AsyncAnthropic | None = None

HINT_TTL = 60 * 60 * 24 * 7   # 7 days — hints are universal across users
FEEDBACK_TTL = 60 * 60 * 24   # 24 hours — tied to sessionId for async polling


def _get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.claude_api_key
        )
    return _anthropic_client


class AIService:

    def __init__(self, cache: AIResponseCache, prompt_builder: PromptBuilder):
        self.cache = cache
        self.prompt_builder = prompt_builder

    # ── PUBLIC INTERFACE ──────────────────────────────────────────────────────

    async def generate_hint(
        self,
        problem_id: str,
        problem_description: str,
        user_code: str,
        hint_level: int,
        fallback_hint: str,
    ) -> dict:
        cache_key = f"hint:{problem_id}:{hint_level}"
        cached = await self.cache.get(cache_key)
        if cached:
            return {"content": cached, "source": "CACHE"}

        prompt = self.prompt_builder.build_hint_prompt(
            problem_description, user_code, hint_level
        )
        response = await self._call_ai(prompt)

        # CRITICAL: reject if AI slips code into the hint — retry once
        if self._contains_code(response):
            strict = self.prompt_builder.build_strict_no_code_hint_prompt(
                problem_description, hint_level
            )
            response = await self._call_ai(strict)
            if self._contains_code(response):
                return {"content": fallback_hint, "source": "FALLBACK"}

        await self.cache.set(cache_key, response, HINT_TTL)
        return {"content": response, "source": "AI"}

    async def generate_feedback(
        self,
        problem_description: str,
        submitted_code: str,
        execution_result: dict,
        session_status: str,
    ) -> str:
        # Feedback is NOT cached — unique to the user's exact submitted code
        prompt = self.prompt_builder.build_feedback_prompt(
            problem_description, submitted_code, execution_result, session_status
        )
        return await self._call_ai(prompt)

    # ── PROVIDER ROUTER ───────────────────────────────────────────────────────

    async def _call_ai(self, prompt: str) -> str:
        """
        Routes to the correct AI provider via AI_PROVIDER env var.
        Switching providers = changing one environment variable. Zero code change.
        """
        provider = settings.ai_provider.lower()
        if provider == "claude":
            return await self._call_claude(prompt)
        elif provider == "ollama":
            return await self._call_ollama(prompt)
        else:
            raise ValueError(
                f"Unknown AI_PROVIDER: '{provider}'. Must be 'claude' or 'ollama'."
            )

    # ── CLAUDE ────────────────────────────────────────────────────────────────

    async def _call_claude(self, prompt: str) -> str:
        client = _get_anthropic_client()
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    # ── OLLAMA ────────────────────────────────────────────────────────────────

    async def _call_ollama(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 512,
                    },
                },
            )
            resp.raise_for_status()
            return resp.json()["response"]

    # ── HELPERS ───────────────────────────────────────────────────────────────

    def _contains_code(self, text: str) -> bool:
        markers = ["```", "def ", "class ", "public ", "function ", "return "]
        return any(m in text for m in markers)
