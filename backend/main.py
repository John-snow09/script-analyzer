from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import re
from collections import Counter

app = FastAPI()

# ✅ CORS (for React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "SRT Script Analyzer API is running"}

# 🎬 Clean SRT (remove timestamps, numbers)
def clean_srt(text):
    lines = text.splitlines()
    cleaned_lines = []

    for line in lines:
        line = line.strip()

        if not line:
            continue
        if line.isdigit():
            continue
        if "-->" in line:
            continue

        cleaned_lines.append(line)

    return " ".join(cleaned_lines)

# 🧠 Extract metrics (NO scoring here)
def analyze_text(text):
    words = re.findall(r'\w+', text.lower())
    sentences = re.split(r'[.!?]+', text)

    total_words = len(words)
    unique_words = len(set(words))

    if total_words == 0:
        return {
            "word_count": 0,
            "unique_words": 0,
            "diversity": 0,
            "avg_sentence_length": 0
        }

    diversity = unique_words / total_words

    avg_sentence_length = total_words / max(len(sentences), 1)

    return {
        "word_count": total_words,
        "unique_words": unique_words,
        "diversity": round(diversity, 3),
        "avg_sentence_length": round(avg_sentence_length, 2)
    }

# 📂 Compare SRT files with smart logic
@app.post("/compare")
async def compare(files: List[UploadFile] = File(...)):
    results = []

    for file in files:
        # ❌ Only allow .srt
        if not file.filename.endswith(".srt"):
            continue

        content = await file.read()

        try:
            text = content.decode("utf-8")
        except:
            text = content.decode("latin-1")

        cleaned_text = clean_srt(text)
        details = analyze_text(cleaned_text)

        results.append({
            "filename": file.filename,
            "details": details
        })

    if not results:
        return {"best_file": None, "results": []}

    # 🔥 Decide comparison mode
    word_counts = [r["details"]["word_count"] for r in results]

    if max(word_counts) - min(word_counts) < 200:
        mode = "quality"
    else:
        mode = "richness"

    # 🔥 Apply scoring
    for r in results:
        d = r["details"]

        if mode == "quality":
            score = (
                d["diversity"] * 100
                - d["avg_sentence_length"] * 0.5
            )
            reason = "Chosen based on better writing quality (diversity & structure)"
        else:
            score = (
                d["word_count"] * 0.5 +
                d["diversity"] * 50
            )
            reason = "Chosen based on richer content (more data + good diversity)"

        r["score"] = round(score, 2)
        r["reason"] = reason

    # 🏆 Sort results
    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "mode": mode,
        "best_file": results[0]["filename"],
        "results": results
    }