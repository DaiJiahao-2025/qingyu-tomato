import { config } from "./config";
import { createApp } from "./app";

const app = createApp();

app.listen(config.port, () => {
  console.log(`fanqie-server listening on http://localhost:${config.port}`);
});
