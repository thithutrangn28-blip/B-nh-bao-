import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const tasks = new Map<string, { status: 'pending' | 'completed' | 'failed', result?: any, error?: string }>();

  app.post("/api/tasks/submit", async (req, res) => {
    const { taskId, prompt, apiKey, model, endpoint, type } = req.body;
    
    if (!taskId) return res.status(400).json({ error: "taskId is required" });
    
    tasks.set(taskId, { status: 'pending' });
    res.json({ status: 'pending', taskId });

    // Run in background
    (async () => {
      try {
        const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
        if (!finalApiKey) throw new Error("API key missing");

        let apiUrl = endpoint.trim();
        if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
        
        const getCompletionUrl = (base: string) => {
          if (base.includes('openai.com')) return `${base}/chat/completions`;
          if (base.includes('anthropic.com')) return `${base}/messages`;
          if (base.includes('googleapis.com')) return `${base}/models/${model}:generateContent`;
          return `${base}/chat/completions`;
        };

        const completionUrl = getCompletionUrl(apiUrl);

        // Retry logic for transient errors (503, 429, etc.)
        const maxRetries = 3;
        let lastError = null;
        let text = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const response = await fetch(completionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalApiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 16384,
                temperature: 0.8
              })
            });

            if (!response.ok) {
              // If it's a transient error, retry
              if ([503, 504, 429, 500].includes(response.status) && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
                console.log(`Task ${taskId} attempt ${attempt + 1} failed with ${response.status}. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
              }
              throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            text = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("No content generated");
            break; // Success!
          } catch (err: any) {
            lastError = err;
            if (attempt < maxRetries - 1) {
              const delay = Math.pow(2, attempt) * 2000;
              await new Promise(r => setTimeout(r, delay));
            } else {
              throw err;
            }
          }
        }

        tasks.set(taskId, { status: 'completed', result: text });
      } catch (error: any) {
        console.error(`Task ${taskId} failed:`, error);
        tasks.set(taskId, { status: 'failed', error: error.message });
      }
    })();
  });

  app.get("/api/tasks/status/:taskId", (req, res) => {
    const { taskId } = req.params;
    const task = tasks.get(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  });

  app.post("/api/generate-direct", async (req, res) => {
    const { prompt, apiKey, model, endpoint } = req.body;
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!finalApiKey) return res.status(400).json({ error: "API key is required." });

    const maxRetries = 2;
    let lastError = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        let apiUrl = endpoint.trim();
        if (!apiUrl.startsWith('http')) apiUrl = 'https://' + apiUrl;
        if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
        
        const getCompletionUrl = (base: string) => {
          if (base.includes('openai.com')) return `${base}/chat/completions`;
          if (base.includes('anthropic.com')) return `${base}/messages`;
          if (base.includes('googleapis.com')) return `${base}/models/${model}:generateContent`;
          return `${base}/chat/completions`;
        };

        const completionUrl = getCompletionUrl(apiUrl);

        const response = await fetch(completionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${finalApiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 16384,
            temperature: 0.7 // Slightly lower temperature for more consistent JSON
          })
        });

        if (!response.ok) {
          if (response.status === 503 || response.status === 429 || response.status === 504) {
             throw new Error(`API Error: ${response.status}`);
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No content generated");

        return res.json({ result: text });
      } catch (error: any) {
        lastError = error;
        console.error(`Direct generation attempt ${i + 1} failed:`, error.message);
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Simple backoff
        }
      }
    }

    res.status(500).json({ error: lastError?.message || "Generation failed after retries" });
  });

  app.post("/api/generate-content", async (req, res) => {
    const { prompt, systemInstruction, apiKey, model, endpoint } = req.body;
    
    console.log("Received request for content generation. Model:", model, "Endpoint:", endpoint);
    console.log("API Key present:", !!apiKey);
    
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (!finalApiKey) {
      return res.status(400).json({ error: "API key is required." });
    }

    try {
      const genAI = new GoogleGenerativeAI(finalApiKey);
      const modelInstance = genAI.getGenerativeModel({ 
        model: model || "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });
      
      const result = await modelInstance.generateContentStream({
        contents: prompt,
        generationConfig: {
          maxOutputTokens: req.body.maxTokens || 30000,
        },
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result.stream) {
        res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error("Error generating content:", error);
      const errorMessage = error.message || "Failed to generate content";
      res.status(500).json({ error: errorMessage });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
