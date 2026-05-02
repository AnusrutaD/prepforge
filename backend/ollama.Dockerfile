FROM ollama/ollama:latest

# Pre-pull model during build so first request is not slow
RUN ollama serve & sleep 10 && ollama pull llama3.1 && pkill ollama

EXPOSE 11434
CMD ["ollama", "serve"]
