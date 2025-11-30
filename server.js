const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbPath = "./db.json";
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, "public/uploads"),
        filename: (req, file, cb) => {
            const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, unique + path.extname(file.originalname));
        }
    })
});


// ---------------------- AUTH ----------------------
app.post("/api/signup", (req, res) => {
    const { username, password } = req.body;
    const db = JSON.parse(fs.readFileSync(dbPath));

    if (db.users[username]) {
        return res.status(400).json({ error: "User exists." });
    }

    db.users[username] = { password, stories: [] };
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.json({ success: true });
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const db = JSON.parse(fs.readFileSync(dbPath));

    const user = db.users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials." });
    }

    res.json({ success: true });
});


// ---------------------- STORIES ----------------------
app.get("/api/stories/:username", (req, res) => {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const user = db.users[req.params.username];
    res.json(user ? user.stories : []);
});

app.post("/api/story", upload.single("image"), (req, res) => {
    const { username, title, content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const db = JSON.parse(fs.readFileSync(dbPath));

    if (!db.users[username]) return res.status(400).json({ error: "User not found." });

    db.users[username].stories.push({
        id: Date.now().toString(),
        title,
        content,
        imageUrl
    });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.json({ success: true });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log("Diary server running on http://localhost:" + PORT);
});

