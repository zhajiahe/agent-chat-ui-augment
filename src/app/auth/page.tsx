"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login({ username: loginUsername, password: loginPassword });
      router.push("/");
    } catch (err: any) {
      setLoginError(err?.message || "登录失败");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      await register({
        username: registerUsername,
        password: registerPassword,
        email: registerEmail || undefined
      });
      router.push("/");
    } catch (err: any) {
      setRegisterError(err?.message || "注册失败");
    } finally {
      setRegisterLoading(false);
    }
  };

  const resetForms = () => {
    setLoginUsername("");
    setLoginPassword("");
    setLoginError(null);
    setRegisterUsername("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterError(null);
  };

  const switchMode = (newMode: AuthMode) => {
    if (mode !== newMode) {
      resetForms();
      setMode(newMode);
    }
  };

  // If already logged in, redirect to home
  const { user, initialized } = useAuth();
  useEffect(() => {
    if (initialized && user) {
      router.replace("/");
    }
  }, [initialized, user, router]);

  return (
    <div className="w-full max-w-md">
      {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={mode === "login" ? "default" : "ghost"}
                className={`flex-1 rounded-md text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => switchMode("login")}
              >
                登录
              </Button>
              <Button
                variant={mode === "register" ? "default" : "ghost"}
                className={`flex-1 rounded-md text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => switchMode("register")}
              >
                注册
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-sm font-medium text-gray-700">
                    用户名
                  </Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                    密码
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="请输入密码"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{loginError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  {loginLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>登录中...</span>
                    </div>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-sm font-medium text-gray-700">
                    用户名
                  </Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-sm font-medium text-gray-700">
                    邮箱 <span className="text-gray-400 text-xs">(可选)</span>
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="请输入邮箱地址"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">
                    密码
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="请输入密码"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {registerError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{registerError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                >
                  {registerLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>注册中...</span>
                    </div>
                  ) : (
                    "注册"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
     </div>
  );
}