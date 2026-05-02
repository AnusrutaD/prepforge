FROM python:3.12-slim

WORKDIR /app

# Install deps first — layer is cached unless requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway injects PORT — default 8000 for local
ENV PORT=8000

EXPOSE $PORT

# Run migrations then start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
