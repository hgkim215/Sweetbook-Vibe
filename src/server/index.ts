import path from 'node:path';
import { createApp } from './app.js';
import { createRepository } from './repository.js';

const port = Number(process.env.PORT || 3000);
const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const repo = createRepository(path.join(dataDir, 'growthbook.sqlite'));
const app = createApp(repo);

app.listen(port, () => {
  console.log(`GrowthBook 서버 실행 중: http://localhost:${port}`);
});

