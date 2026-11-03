import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "./env";

// Für `sanity deploy` (Studio unter <name>.sanity.studio hosten). Vor dem ersten Deploy studio/.env ausfüllen.
export default defineCliConfig({ api: { projectId, dataset } });
