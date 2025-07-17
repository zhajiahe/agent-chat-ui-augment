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
import { PasswordInput } from "@/components/ui/password-input";
import { Settings, ArrowRight } from "lucide-react";
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { getApiKey } from "@/lib/api-key";
import { toast } from "sonner";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";

// Default values for the form
const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "agent";

interface SettingsDialogProps {
  variant?: "button" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SettingsDialog({ variant = "icon", size = "default" }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined = process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [apiUrl, setApiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || "",
  });
  const [assistantId, setAssistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });

  // For API key, use localStorage with env var fallback
  const [apiKey, _setApiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newApiUrl = formData.get("apiUrl") as string;
    const newAssistantId = formData.get("assistantId") as string;
    const newApiKey = formData.get("apiKey") as string;

    // Update the values
    setApiUrl(newApiUrl);
    setApiKey(newApiKey);
    setAssistantId(newAssistantId);

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
            <DialogTitle className="text-xl">Agent Chat Settings</DialogTitle>
          </div>
          <DialogDescription>
            Configure your LangGraph deployment settings. These settings are saved in your browser and used to connect to your LangGraph server.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">
              Deployment URL<span className="text-rose-500">*</span>
            </Label>
            <p className="text-muted-foreground text-sm">
              This is the URL of your LangGraph deployment. Can be a local, or production deployment.
            </p>
            <Input
              id="apiUrl"
              name="apiUrl"
              defaultValue={apiUrl || DEFAULT_API_URL}
              placeholder="http://localhost:2024"
              required
            />
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
            <Label htmlFor="apiKey">LangSmith API Key</Label>
            <p className="text-muted-foreground text-sm">
              This is <strong>NOT</strong> required if using a local LangGraph server. This value is stored in your browser's local storage and is only used to authenticate requests sent to your LangGraph server.
            </p>
            <PasswordInput
              id="apiKey"
              name="apiKey"
              defaultValue={apiKey ?? ""}
              placeholder="lsv2_pt_..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Settings
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}