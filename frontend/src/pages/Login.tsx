import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import toast, { Toaster } from "react-hot-toast";
import "./Login.css";

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
    const navigate = useNavigate(); // ← 新增
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            toast.error("请输入用户名和密码");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("https://api.zhaoplatforme.com/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) throw new Error("Login failed");

            const data = await res.json();
            onLogin(data.token);
            localStorage.setItem("token", data.token);
            toast.success("Vous êtes connectez！");

            // 登录成功后直接跳转到 Recettes 页面
            navigate("/recettes", { replace: true });
        } catch {
            toast.error("Identifiant ou Mot de passe incorrect");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="login-container">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'white',
                        color: '#e4afb0',
                        border: '2px solid #fddede',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                    },
                    success: {
                        iconTheme: { primary: '#e4afb0', secondary: 'white' },
                    },
                    error: {
                        iconTheme: { primary: '#ff6b6b', secondary: 'white' },
                    },
                }}
            />
            <Header />
            <div className="login-background">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Bienvenue</h1>
                        <p>Connectez-vous pour voir les recettes</p>
                    </div>

                    <div className="login-form">
                        <div className="input-group">
                            <label htmlFor="username">Identifiant</label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Entrez votre identifiant"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Mot de passe</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Entrez le mot de passe"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="login-input"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading || !username || !password}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    Connection en cours...
                                </>
                            ) : (
                                'Valider'
                            )}
                        </button>
                    </div>

                    <div className="login-footer">
                        <p>Contactez Wang Yong pour avoir les identifiants</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
