import { getApplicationConfig } from './infrastructure/config/application-config.js';
import { createApp } from './presentation/app/create-app.js';

const config = getApplicationConfig();
const app = createApp();

app.listen(config.port, () => {
  console.log(`CicloViento backend listening on port ${config.port}`);
});
