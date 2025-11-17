import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const SECRET_KEY = "your_secret_key";

// 模拟用户数据
const USERS = [
    { username: "admin", password: "1986" }
];

// 登录接口
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: "用户名或密码错误" });

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// 验证 Token 中间件
export const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "未授权" });

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, SECRET_KEY);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ message: "Token 无效或过期" });
    }
};

export default router;
