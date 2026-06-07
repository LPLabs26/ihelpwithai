# ihelpwithai.com worker — runs the engine off-site. Includes ffmpeg.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends bash ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Bring in the engine package + the worker.
# Expected layout when building:
#   /app/skill_builder/    (copied from the engine project)
#   /app/worker.py /app/emails.py /app/requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "worker.py"]
