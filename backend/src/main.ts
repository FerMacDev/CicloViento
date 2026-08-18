import { createApplicationDependencies } from './infrastructure/config/application-container.js';
import { getApplicationConfig } from './infrastructure/config/application-config.js';
import { createApp } from './presentation/app/create-app.js';

const config = getApplicationConfig();
const dependencies = createApplicationDependencies();
const app = createApp(dependencies, config.corsOrigin);

app.listen(config.port, () => {
  console.log(`CicloViento backend listening on port ${config.port}`);
});
