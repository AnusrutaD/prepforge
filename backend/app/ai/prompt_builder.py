from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"


class PromptBuilder:
    """
    Loads versioned prompt templates from /prompts/ directory.
    Never hardcode prompt text in Python — change wording = change the .txt file.
    Every prompt change should be a git commit explaining the why.
    """

    def _load(self, filename: str) -> str:
        path = PROMPTS_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Prompt template not found: {filename}")
        return path.read_text(encoding="utf-8")

    def build_hint_prompt(self, problem: str, code: str, level: int) -> str:
        t = self._load(f"hint_level_{level}.txt")
        return t.replace("{{PROBLEM}}", problem).replace("{{USER_CODE}}", code)

    def build_strict_no_code_hint_prompt(self, problem: str, level: int) -> str:
        t = self._load(f"hint_level_{level}.txt")
        return t.replace("{{PROBLEM}}", problem).replace("{{USER_CODE}}", "")

    def build_feedback_prompt(
        self, problem: str, code: str, result: dict, status: str
    ) -> str:
        fname = "feedback_solved.txt" if status == "SOLVED" else "feedback_failed.txt"
        t = self._load(fname)
        return (
            t.replace("{{PROBLEM}}", problem)
            .replace("{{CODE}}", code)
            .replace("{{RESULT}}", str(result))
        )

    def build_diagnostic_prompt(self, answers: list[dict]) -> str:
        t = self._load("diagnostic_eval.txt")
        return t.replace("{{ANSWERS}}", str(answers))
