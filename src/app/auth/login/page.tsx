"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // If already logged in, redirect to home
  const { user, initialized } = useAuth();
  useEffect(() => {
    if (initialized && user) {
      router.replace("/");
    }
  }, [initialized, user, router]);

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

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">登录</h1>
            <p className="text-sm text-gray-600 mt-2">请输入您的账户信息</p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
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

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/auth/register")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                还没有账户？立即注册
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
