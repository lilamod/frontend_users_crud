require("dotenv").config(); 
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// Use environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;

app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

mongoose.connect(MONGO_URI)
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err.message));

const tokenBlacklist = [];

async function auth(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if(!token) return res.status(401).json({ msg: "No token available, access denied" });

    if(tokenBlacklist.includes(token)) {
        return res.status(400).json({ msg: "Please login again" });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(verified.id);
        req.user = user;
        next();
    } catch (error) {
        res.status(400).json({ msg: "Invalid token" });
    }
}

function authorization(allowedRole){
    return (req, res, next) => {
        const userRole = req.user.role;
        if(!allowedRole.includes(userRole)){
            return res.status(403).send("You do not have permission to access this router");
        }
        next();
    }
}

app.use(express.json());

app.post("/signup", async(req, res) => {
    try {
        const { email, name, password, role } = req.body;
        const duplicateEmail = await User.findOne({ email });
        if(duplicateEmail) return res.status(400).json({ email: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, role, password: hashedPassword });
        await newUser.save();
        res.status(200).json({ msg: "User created successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
});

app.post("/login", async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ msg: "Login successful", token });
});

app.post("/logout", auth, async(req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    tokenBlacklist.push(token);
    res.status(200).json({ msg: "Logout successful" });
});

app.get("/profile", auth, async(req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

app.get("/admin", auth, authorization(['admin']), async(req, res) => {
    const users = await User.find();
    res.json(users);
});

app.post("/users", auth, async(req,res) => {
    const { search } = req.body;
    const users = await User.find({
        $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ]
    });
    res.status(200).json({ data: users });
});

app.get("/user/:id", auth, async(req, res) => {
    const user = await User.findById(req.params.id);
    res.status(200).json({ user });
});

app.put("/user/:id", auth, async(req, res) => {
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json({ message: "User details updated successfully" });
});

app.delete("/user/:id", auth, async(req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
