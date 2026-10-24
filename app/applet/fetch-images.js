const https = require("https");
const urls = ["https://ibb.co/8DsksSJX", "https://ibb.co/5XLx85SG", "https://ibb.co/939J2gN3"];

urls.forEach(u => {
  https.get(u, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      const ogMatch = data.match(/property="og:image"\s+content="([^"]+)"/);
      const directMatch = data.match(/https:\/\/i\.ibb\.co\/[a-zA-Z0-9_\-]+\/[^"'\s<>]+\.(?:png|jpg|jpeg|webp)/i);
      console.log(u, "=> og:", ogMatch ? ogMatch[1] : "none", "=> direct:", directMatch ? directMatch[0] : "none");
    });
  }).on("error", err => console.log(u, "ERR:", err.message));
});
