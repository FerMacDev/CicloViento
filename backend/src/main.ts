import { createRegisterUserUseCase } from './infrastructure/config/application-container.js';
import { getApplicationConfig } from './infrastructure/config/application-config.js';
import { createApp } from './presentation/app/create-app.js';

const config = getApplicationConfig();
const registerUserUseCase = createRegisterUserUseCase();
const app = createApp(registerUserUseCase);

app.listen(config.port, () => {
  console.log(`CicloViento backend listening on port ${config.port}`);
});
