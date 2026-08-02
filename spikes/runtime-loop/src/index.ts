// src/index.ts

import { run } from './runtime.js';

async function main() {
  try {
    await run('what is weather in pune');
  } catch (error) {
    console.error(error);
  }
}

main();
