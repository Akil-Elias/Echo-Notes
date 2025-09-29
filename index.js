import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const app = express();
const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Upload & transcribe
app.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    const audioFile = fs.createReadStream(req.file.path);

    // Step 1: Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
    });

    const transcript = transcription.text;

    // Step 2: Summarize into minutes
    const summary = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an assistant that converts meeting transcripts into structured minutes with attendees, key points, and action items.",
        },
        { role: "user", content: transcript },
      ],
    });

    // Step 3: Return both
    res.json({
      transcript,
      minutes: summary.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
