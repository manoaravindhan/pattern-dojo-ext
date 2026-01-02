import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    reporter: 'spec',
    timeout: 10000
  });

  const testsRoot = path.resolve(__dirname, '..');
  const testFiles = await glob('**/test/unit/**/*.test.js', { cwd: testsRoot });

  // Add files to the test suite
  for (const file of testFiles) {
    mocha.addFile(path.resolve(testsRoot, file));
  }

  return new Promise((resolve, reject) => {
    // Run the mocha test
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed`));
      } else {
        resolve();
      }
    });
  });
}

// Run tests if this is the main module
if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
