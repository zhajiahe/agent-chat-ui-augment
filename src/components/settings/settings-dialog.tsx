import React, { useState } from "react";
import { useQueryState } from "nuqs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowRight } from "lucide-react";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { toast } from "sonner";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

// Default values for the form
const DEFAULT_ASSISTANT_ID = "sql_supervisor";
const DEFAULT_LLM_MODEL = "google/gemini-2.5-flash";
const DEFAULT_PROVIDER = "openrouter";
const DEFAULT_DB_URL = "/data2/zhanghuaao/ai_database/data_agent_supervisor/db_example/cement.db";

interface SettingsDialogProps {
  variant?: "button" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SettingsDialog({ variant = "icon", size = "default" }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Get environment variables
  const envAssistantId: string | undefined = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [assistantId, setAssistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });

  const [llmModel, setLlmModel] = useQueryState("llmModel", {
    defaultValue: DEFAULT_LLM_MODEL,
  });

  const [provider, setProvider] = useQueryState("provider", {
    defaultValue: DEFAULT_PROVIDER,
  });

  const [dbUrl, setDbUrl] = useQueryState("dbUrl", {
    defaultValue: DEFAULT_DB_URL,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newAssistantId = formData.get("assistantId") as string;
    const newLlmModel = formData.get("llmModel") as string;
    const newProvider = formData.get("provider") as string;
    const newDbUrl = formData.get("dbUrl") as string;

    // Update the values
    setAssistantId(newAssistantId);
    setLlmModel(newLlmModel);
    setProvider(newProvider);
    setDbUrl(newDbUrl);

    // Show success message
    toast.success("Settings updated successfully!");

    // Close the dialog
    setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerComponent}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <LangGraphLogoSVG className="h-6" />
            <DialogTitle className="text-xl">设置</DialogTitle>
          </div>
          <DialogDescription>
            Configure your LangGraph deployment settings. These settings are saved in your browser and used to connect to your LangGraph server.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">API Connection</span>
              </div>
              <p className="text-sm text-blue-800">
                API requests are securely routed through the internal server proxy. 
                The LangGraph API URL is configured server-side for security.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistantId">
                Assistant / Graph ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                This is the ID of the graph (can be the graph name), or assistant to fetch threads from, and invoke when actions are taken.
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
                placeholder="agent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="llmModel">
                LLM Model<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                Name of the language model to use. Must be a valid language model name.
              </p>
              <Input
                id="llmModel"
                name="llmModel"
                defaultValue={llmModel || DEFAULT_LLM_MODEL}
                placeholder="google/gemini-2.5-flash"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">
                Provider<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                Provider of the language model. Supported providers: openrouter, hf-mirror
              </p>
              <Input
                id="provider"
                name="provider"
                defaultValue={provider || DEFAULT_PROVIDER}
                placeholder="openrouter"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dbUrl">
                Database URL
              </Label>
              <p className="text-muted-foreground text-sm">
                Database URL，支持sqlite, mysql, postgresql，excel/csv本地文件，s3, minio等
              </p>
              <Input
                id="dbUrl"
                name="dbUrl"
                defaultValue={dbUrl || DEFAULT_DB_URL}
                placeholder="sqlite:///path/to/database.db"
              />
            </div>
          </form>
        </div>
        
        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="settingsForm">
            Save Settings
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}