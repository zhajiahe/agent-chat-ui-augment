import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { backendApi, DataSource, Memory } from "@/lib/backend-client";
import { useAuth } from "@/providers/Auth";

interface SettingsDialogProps {
  variant?: "button" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SettingsDialog({ variant = "icon", size = "default" }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();

  // Backend-managed state
  const [sources, setSources] = useState<DataSource[] | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [memories, setMemories] = useState<Memory[] | null>(null);

  // Form states
  const [showAddSourceForm, setShowAddSourceForm] = useState(false);
  const [showAddMemoryForm, setShowAddMemoryForm] = useState(false);
  const [showEditMemoryForm, setShowEditMemoryForm] = useState<number | null>(null);
  const [newSource, setNewSource] = useState({ name: '', dialect: 'sqlite' as DataSource['dialect'], connection_details: '{}' });
  const [newMemory, setNewMemory] = useState({ content: '', type: 'other' as Memory['type'], is_active: true });
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const refreshSources = async () => {
    if (!token) return;
    try {
      const list = await backendApi.listSources();
      setSources(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load data sources");
    }
  };

  const refreshMemories = async (dsId: number) => {
    if (!token) return;
    try {
      const list = await backendApi.listMemories(dsId);
      setMemories(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load memories");
    }
  };

  const onOpenChange = async (v: boolean) => {
    setOpen(v);
    if (v && token) {
      await refreshSources();
      // 如果没有数据源，强制显示新增表单
      if (!sources || sources.length === 0) {
        setShowAddSourceForm(true);
      }
      // 如果有数据源且没有选择，默认选择第一个
      else if (sources && sources.length > 0 && !selectedSourceId) {
        setSelectedSourceId(sources[0].id);
        refreshMemories(sources[0].id);
      }
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const connection_details = JSON.parse(newSource.connection_details);
      const created = await backendApi.createSource({
        name: newSource.name,
        dialect: newSource.dialect,
        connection_details
      });
      toast.success("数据源已创建");
      await refreshSources();
      setSelectedSourceId(created.id);
      // 自动选择新创建的数据源并加载记忆
      refreshMemories(created.id);
      setShowAddSourceForm(false);
      setNewSource({ name: '', dialect: 'sqlite', connection_details: '{}' });

      // 如果是在主页面弹出的设置对话框，创建数据源后刷新页面
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e: any) {
      toast.error(e?.message || "创建失败");
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId) return;

    try {
      await backendApi.createMemory({
        data_source_id: selectedSourceId,
        content: newMemory.content,
        type: newMemory.type,
        is_active: newMemory.is_active
      });
      toast.success("记忆已新增");
      await refreshMemories(selectedSourceId);
      setShowAddMemoryForm(false);
      setNewMemory({ content: '', type: 'other', is_active: true });
    } catch (e: any) {
      toast.error(e?.message || "新增失败");
    }
  };

  const handleEditMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;

    try {
      await backendApi.updateMemory(editingMemory.id, {
        content: editingMemory.content,
        is_active: editingMemory.is_active
      });
      toast.success("记忆已更新");
      await refreshMemories(selectedSourceId!);
      setShowEditMemoryForm(null);
      setEditingMemory(null);
    } catch (e: any) {
      toast.error(e?.message || "更新失败");
    }
  };

  const startEditMemory = (memory: Memory) => {
    setEditingMemory(memory);
    setShowEditMemoryForm(memory.id);
  };

  const TriggerComponent = variant === "icon" ? (
    <TooltipIconButton
      size={size}
      tooltip="Settings"
      variant="ghost"
    >
      <Settings className="size-5" />
    </TooltipIconButton>
  ) : (
    <Button variant="outline" size={size}>
      <Settings className="size-4 mr-2" />
      Settings
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {TriggerComponent}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">数据源与记忆管理</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          {/* Data Sources Management */}
          <div className="pt-4 border-t">
            <Label>数据源管理</Label>
            {!token ? (
              <p className="text-sm text-muted-foreground mt-2">请先登录以管理数据源</p>
            ) : !sources || sources.length === 0 ? (
              <div className="mt-3 space-y-3">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    您还没有配置任何数据源，请先添加一个数据源以开始使用系统。
                  </p>
                </div>
                <button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                  onClick={() => setShowAddSourceForm(true)}
                >
                  <Plus className="w-4 h-4" /> 新增数据源
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 min-w-56"
                    value={selectedSourceId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null;
                      setSelectedSourceId(val);
                      if (val) refreshMemories(val);
                    }}
                  >
                    <option value="">选择数据源</option>
                    {(sources || []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.dialect})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="text-sm inline-flex items-center gap-1"
                    onClick={() => setShowAddSourceForm(true)}
                  >
                    <Plus className="w-4 h-4" /> 新增数据源
                  </button>
                </div>

                {/* Add Data Source Form */}
                {showAddSourceForm && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <form onSubmit={handleAddSource} className="space-y-4">
                      <h4 className="font-medium">新增数据源</h4>

                      <div className="space-y-2">
                        <Label htmlFor="sourceName">数据源名称</Label>
                        <Input
                          id="sourceName"
                          value={newSource.name}
                          onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="请输入数据源名称"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sourceDialect">数据库类型</Label>
                        <select
                          id="sourceDialect"
                          className="border rounded px-2 py-1 w-full"
                          value={newSource.dialect}
                          onChange={(e) => setNewSource(prev => ({ ...prev, dialect: e.target.value as DataSource['dialect'] }))}
                        >
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                          <option value="oracle">Oracle</option>
                          <option value="sqlite">SQLite</option>
                          <option value="csv">CSV</option>
                          <option value="excel">Excel</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sourceDetails">连接配置 (JSON格式)</Label>
                        <textarea
                          id="sourceDetails"
                          className="border rounded px-2 py-1 w-full h-20 font-mono text-sm"
                          value={newSource.connection_details}
                          onChange={(e) => setNewSource(prev => ({ ...prev, connection_details: e.target.value }))}
                          placeholder='{"host": "localhost", "port": 5432, "database": "mydb"}'
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          创建数据源
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddSourceForm(false);
                            setNewSource({ name: '', dialect: 'sqlite', connection_details: '{}' });
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                {selectedSourceId && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      数据源已选择，记忆管理功能已启用
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Memories Management */}
          <div className="pt-4 border-t">
            <Label>记忆管理</Label>
            {!token ? (
              <p className="text-sm text-muted-foreground mt-2">请先登录以管理记忆</p>
            ) : !selectedSourceId ? (
              <p className="text-sm text-muted-foreground mt-2">请选择数据源以查看/管理记忆</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-sm inline-flex items-center gap-1"
                    onClick={() => setShowAddMemoryForm(true)}
                  >
                    <Plus className="w-4 h-4" /> 新增记忆
                  </button>
                </div>

                {/* Add Memory Form */}
                {showAddMemoryForm && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <form onSubmit={handleAddMemory} className="space-y-4">
                      <h4 className="font-medium">新增记忆</h4>

                      <div className="space-y-2">
                        <Label htmlFor="memoryContent">记忆内容</Label>
                        <textarea
                          id="memoryContent"
                          className="border rounded px-2 py-1 w-full h-20 font-mono text-sm"
                          value={newMemory.content}
                          onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="请输入记忆内容"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="memoryType">类型</Label>
                        <select
                          id="memoryType"
                          className="border rounded px-2 py-1 w-full"
                          value={newMemory.type}
                          onChange={(e) => setNewMemory(prev => ({ ...prev, type: e.target.value as Memory['type'] }))}
                        >
                          <option value="database">Database</option>
                          <option value="table">Table</option>
                          <option value="column">Column</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="memoryActive"
                          checked={newMemory.is_active}
                          onChange={(e) => setNewMemory(prev => ({ ...prev, is_active: e.target.checked }))}
                        />
                        <Label htmlFor="memoryActive">激活状态</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" size="sm">
                          创建记忆
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddMemoryForm(false);
                            setNewMemory({ content: '', type: 'other', is_active: true });
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-auto border rounded p-2">
                  {(memories || []).map((m) => (
                    <div key={m.id}>
                      {showEditMemoryForm === m.id ? (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <form onSubmit={handleEditMemory} className="space-y-3">
                            <h5 className="font-medium">编辑记忆</h5>

                            <div className="space-y-2">
                              <Label htmlFor={`memoryContent-${m.id}`}>记忆内容</Label>
                              <textarea
                                id={`memoryContent-${m.id}`}
                                className="border rounded px-2 py-1 w-full h-20 font-mono text-sm"
                                value={editingMemory?.content || ''}
                                onChange={(e) => setEditingMemory(prev => prev ? { ...prev, content: e.target.value } : null)}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`memoryType-${m.id}`}>类型</Label>
                              <select
                                id={`memoryType-${m.id}`}
                                className="border rounded px-2 py-1 w-full"
                                value={editingMemory?.type || 'other'}
                                onChange={(e) => setEditingMemory(prev => prev ? { ...prev, type: e.target.value as Memory['type'] } : null)}
                              >
                                <option value="database">Database</option>
                                <option value="table">Table</option>
                                <option value="column">Column</option>
                                <option value="other">Other</option>
                              </select>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`memoryActive-${m.id}`}
                                checked={editingMemory?.is_active || false}
                                onChange={(e) => setEditingMemory(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
                              />
                              <Label htmlFor={`memoryActive-${m.id}`}>激活状态</Label>
                            </div>

                            <div className="flex gap-2">
                              <Button type="submit" size="sm">
                                保存
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowEditMemoryForm(null);
                                  setEditingMemory(null);
                                }}
                              >
                                取消
                              </Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 border rounded px-2 py-1">
                          <div className="text-sm flex-1 truncate">
                            <span className="text-muted-foreground">[{m.type}]</span> {m.content}
                            {m.is_active ? (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">激活</span>
                            ) : (
                              <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-1 rounded">未激活</span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              type="button"
                              className="text-sm inline-flex items-center gap-1"
                              onClick={() => startEditMemory(m)}
                            >
                              <Pencil className="w-4 h-4" /> 修改
                            </button>
                            <button
                              type="button"
                              className="text-sm inline-flex items-center gap-1 text-rose-600"
                              onClick={async () => {
                                if (!confirm("确定删除该记忆？")) return;
                                try {
                                  await backendApi.deleteMemory(m.id);
                                  toast.success("已删除");
                                  await refreshMemories(selectedSourceId);
                                } catch (e: any) {
                                  toast.error(e?.message || "删除失败");
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" /> 删除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}