"use client";

import React, { useState } from "react";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

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

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">注册</h1>
            <p className="text-sm text-gray-600 mt-2">创建您的账户</p>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
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

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => router.push("/auth/login")}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                已有账户？立即登录
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
