"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { ArtifactProvider } from "@/components/thread/artifact";
import { Toaster } from "@/components/ui/sonner";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "next/navigation";
import { backendApi, DataSource } from "@/lib/backend-client";
import { SettingsDialog } from "@/components/settings";

export default function DemoPage(): React.ReactNode {
  const Guard: React.FC = () => {
    const { user, token, initialized } = useAuth();
    const router = useRouter();
    const [sources, setSources] = useState<DataSource[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    // 检查数据源
    const checkDataSources = useCallback(async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const dataSources = await backendApi.listSources();
        setSources(dataSources);
        // 如果没有数据源，显示设置对话框
        if (dataSources.length === 0) {
          setShowSettings(true);
        }
      } catch (error) {
        console.error("Failed to load data sources:", error);
        // 出错时也显示设置页面，让用户配置数据源
        setShowSettings(true);
      } finally {
        setLoading(false);
      }
    }, [token]);

    useEffect(() => {
      if (!initialized) {
        setLoading(false);
        return;
      }
      if (user) {
        checkDataSources();
      } else {
        setLoading(false);
      }
    }, [initialized, user, token, checkDataSources]);

    // 如果认证尚未初始化，显示加载状态
    if (!initialized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在初始化...</p>
          </div>
        </div>
      );
    }

    // 如果用户未登录，重定向到登录页面
    if (initialized && !user) {
      router.replace("/auth");
      return null;
    }

    // 加载中显示加载状态
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在检查数据源配置...</p>
          </div>
        </div>
      );
    }

    // 如果没有数据源，显示设置对话框
    if (sources && sources.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">欢迎使用数据分析助手</h2>
            <p className="text-gray-600 mb-6">
              您需要先配置一个数据源才能开始使用系统。请点击下方按钮添加您的数据源。
            </p>
            <SettingsDialog
              variant="button"
              size="lg"
            />
          </div>
        </div>
      );
    }

    // 有数据源，显示正常的主页面
    return (
      <ThreadProvider>
        <StreamProvider>
          <ArtifactProvider>
            <Thread />
          </ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    );
  };

  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <Guard />
    </React.Suspense>
  );
}
