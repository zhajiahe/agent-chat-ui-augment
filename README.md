# Agent Chat UI

Agent Chat UI is a Next.js application which enables chatting with any LangGraph server with a `messages` key through a chat interface.

> [!NOTE]
> 🎥 Watch the video setup guide [here](https://youtu.be/lInrwVnZ83o).

## Setup

> [!TIP]
> Don't want to run the app locally? Use the deployed site here: [agentchat.vercel.app](https://agentchat.vercel.app)!

First, clone the repository, or run the [`npx` command](https://www.npmjs.com/package/create-agent-chat-app):

```bash
npx create-agent-chat-app
```

or

```bash
git clone https://github.com/langchain-ai/agent-chat-ui.git

cd agent-chat-ui
```

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Usage

Once the app is running (or if using the deployed site), you'll be prompted to enter:

- **Deployment URL**: The URL of the LangGraph server you want to chat with. This can be a production or development URL.
- **Assistant/Graph ID**: The name of the graph, or ID of the assistant to use when fetching, and submitting runs via the chat interface.
- **LangSmith API Key**: (only required for connecting to deployed LangGraph servers) Your LangSmith API key to use when authenticating requests sent to LangGraph servers.

After entering these values, click `Continue`. You'll then be redirected to a chat interface where you can start chatting with your LangGraph server.

## Environment Variables

You can bypass the initial setup form by setting the following environment variables:

```bash
NEXT_PUBLIC_API_URL=http://localhost:2024
NEXT_PUBLIC_ASSISTANT_ID=agent
```

> [!TIP]
> If you want to connect to a production LangGraph server, read the [Going to Production](#going-to-production) section.

To use these variables:

1. Copy the `env.example` file to a new file named `.env.local`
2. Fill in the values in the `.env.local` file with your deployment details
3. Restart the application

When these environment variables are set, the application will use them instead of showing the setup form.

For private deployment configuration, see [PRIVATE_DEPLOYMENT.md](./PRIVATE_DEPLOYMENT.md).

## Hiding Messages in the Chat

You can control the visibility of messages within the Agent Chat UI in two main ways:

**1. Prevent Live Streaming:**

To stop messages from being displayed _as they stream_ from an LLM call, add the `langsmith:nostream` tag to the chat model's configuration. The UI normally uses `on_chat_model_stream` events to render streaming messages; this tag prevents those events from being emitted for the tagged model.

_Python Example:_

```python
from langchain_anthropic import ChatAnthropic

# Add tags via the .with_config method
model = ChatAnthropic().with_config(
    config={"tags": ["langsmith:nostream"]}
)
```

_TypeScript Example:_

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic()
  // Add tags via the .withConfig method
  .withConfig({ tags: ["langsmith:nostream"] });
```

**Note:** Even if streaming is hidden this way, the message will still appear after the LLM call completes if it's saved to the graph's state without further modification.

**2. Hide Messages Permanently:**

To ensure a message is _never_ displayed in the chat UI (neither during streaming nor after being saved to state), prefix its `id` field with `do-not-render-` _before_ adding it to the graph's state, along with adding the `langsmith:do-not-render` tag to the chat model's configuration. The UI explicitly filters out any message whose `id` starts with this prefix.

_Python Example:_

```python
result = model.invoke([messages])
# Prefix the ID before saving to state
result.id = f"do-not-render-{result.id}"
return {"messages": [result]}
```

_TypeScript Example:_

```typescript
const result = await model.invoke([messages]);
// Prefix the ID before saving to state
result.id = `do-not-render-${result.id}`;
return { messages: [result] };
```

This approach guarantees the message remains completely hidden from the user interface.

## Rendering Artifacts

The Agent Chat UI supports rendering artifacts in the chat. Artifacts are rendered in a side panel to the right of the chat. To render an artifact, you can obtain the artifact context from the `thread.meta.artifact` field. Here's a sample utility hook for obtaining the artifact context:

```tsx
export function useArtifact<TContext = Record<string, unknown>>() {
  type Component = (props: {
    children: React.ReactNode;
    title?: React.ReactNode;
  }) => React.ReactNode;

  type Context = TContext | undefined;

  type Bag = {
    open: boolean;
    setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;

    context: Context;
    setContext: (value: Context | ((prev: Context) => Context)) => void;
  };

  const thread = useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { artifact: [Component, Bag] } }
  >();

  return thread.meta?.artifact;
}
```

After which you can render additional content using the `Artifact` component from the `useArtifact` hook:

```tsx
import { useArtifact } from "../utils/use-artifact";
import { LoaderIcon } from "lucide-react";

export function Writer(props: {
  title?: string;
  content?: string;
  description?: string;
}) {
  const [Artifact, { open, setOpen }] = useArtifact();

  return (
    <>
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-lg border p-4"
      >
        <p className="font-medium">{props.title}</p>
        <p className="text-sm text-gray-500">{props.description}</p>
      </div>

      <Artifact title={props.title}>
        <p className="p-4 whitespace-pre-wrap">{props.content}</p>
      </Artifact>
    </>
  );
}
```

## Going to Production

Once you're ready to go to production, you'll need to update how you connect, and authenticate requests to your deployment. By default, the Agent Chat UI is setup for local development, and connects to your LangGraph server directly from the client. This is not possible if you want to go to production, because it requires every user to have their own LangSmith API key, and set the LangGraph configuration themselves.

### Production Setup

To productionize the Agent Chat UI, you'll need to pick one of two ways to authenticate requests to your LangGraph server. Below, I'll outline the two options:

### Quickstart - API Passthrough (Private Deployment)

The quickest way to productionize the Agent Chat UI is to use the [API Passthrough](https://github.com/langchain-ai/langgraph-nextjs-api-passthrough) package. This package provides a simple way to proxy requests to your LangGraph server, and handle authentication for you.

This repository has been configured for private deployment. The API URL is automatically routed through an internal proxy for security. The only configuration you need to do is set the proper environment variables.

```bash
NEXT_PUBLIC_ASSISTANT_ID="agent"
# This should be the deployment URL of your LangGraph server (server-side only)
LANGGRAPH_API_URL="https://my-agent.default.us.langgraph.app"
# Your LangSmith API key which is injected into requests inside the API proxy (server-side only)
LANGSMITH_API_KEY="lsv2_..."
```

Let's cover what each of these environment variables does:

- `NEXT_PUBLIC_ASSISTANT_ID`: The ID of the assistant you want to use when fetching, and submitting runs via the chat interface. This still needs the `NEXT_PUBLIC_` prefix, since it's not a secret, and we use it on the client when submitting requests.
- `LANGGRAPH_API_URL`: The URL of your LangGraph server. This should be the production deployment URL. This is kept private on the server side and not exposed to clients.
- `LANGSMITH_API_KEY`: Your LangSmith API key to use when authenticating requests sent to LangGraph servers. This is a secret that is only used on the server when the API proxy injects it into the request to your deployed LangGraph server.

**Important Notes for Private Deployment:**
- Do NOT set `NEXT_PUBLIC_API_URL` - the application now uses an internal proxy for security
- All API requests are automatically routed through `/api/*` endpoints
- Users cannot modify the API server address in the settings
- The real LangGraph server URL is completely hidden from clients

For detailed deployment instructions, see [PRIVATE_DEPLOYMENT.md](./PRIVATE_DEPLOYMENT.md).

For in depth documentation about the API passthrough package, consult the [LangGraph Next.js API Passthrough](https://www.npmjs.com/package/langgraph-nextjs-api-passthrough) docs.

### Advanced Setup - Custom Authentication (Private Deployment)

Custom authentication in your LangGraph deployment is an advanced, and more robust way of authenticating requests to your LangGraph server. Using custom authentication, you can allow requests to be made from the client, without the need for a LangSmith API key. Additionally, you can specify custom access controls on requests.

**Note**: In the private deployment configuration, custom authentication requires modification of the internal API proxy rather than direct client-side configuration.

To set this up in your LangGraph deployment, please read the LangGraph custom authentication docs for [Python](https://langchain-ai.github.io/langgraph/tutorials/auth/getting_started/), and [TypeScript here](https://langchain-ai.github.io/langgraphjs/how-tos/auth/custom_auth/).

Once you've set up custom authentication on your LangGraph deployment, you should make the following changes to the Agent Chat UI:

1. **Configure the API proxy** - Modify [`src/app/api/[..._path]/route.ts`](src/app/api/[..._path]/route.ts) to handle your custom authentication:
   ```typescript
   export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
     initApiPassthrough({
       apiUrl: process.env.LANGGRAPH_API_URL,
       apiKey: process.env.LANGSMITH_API_KEY,
       runtime: "edge",
       // Add custom headers or authentication logic here
       defaultHeaders: {
         Authorization: `Bearer ${process.env.CUSTOM_AUTH_TOKEN}`,
       },
     });
   ```

2. **Set environment variables**:
   ```bash
   LANGGRAPH_API_URL="https://your-custom-auth-deployment.com"
   NEXT_PUBLIC_ASSISTANT_ID="your-assistant-id"
   CUSTOM_AUTH_TOKEN="your-custom-token"
   ```

3. **Optional client-side token handling** - If you need dynamic token management, modify the [`useTypedStream`](src/providers/Stream.tsx) hook to pass additional headers:
   ```tsx
   const streamValue = useTypedStream({
     apiUrl: finalApiUrl, // This will be the internal proxy URL
     assistantId: finalAssistantId,
     // ... other fields
     defaultHeaders: {
       "X-Custom-Auth": dynamicToken, // Custom headers for your use case
     },
   });
   ```

**Important Considerations for Private Deployment:**
- Authentication configuration happens on the server-side proxy, not the client
- The real LangGraph server URL remains hidden from clients
- Custom tokens and credentials should be managed through environment variables
- Client-side authentication tokens (if needed) should be obtained through secure API endpoints

For more details on private deployment architecture, see [PRIVATE_DEPLOYMENT.md](./PRIVATE_DEPLOYMENT.md).
