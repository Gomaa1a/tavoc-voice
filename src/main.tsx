import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConversationProvider } from "@/context/ConversationContext";

createRoot(document.getElementById("root")!).render(
	<ConversationProvider>
		<App />
	</ConversationProvider>,
);
