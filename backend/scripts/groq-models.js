require("dotenv").config()

fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
})
  .then(r => r.json())
  .then(d => (d.data || []).forEach(m => console.log(m.id)))
  .catch(console.error)