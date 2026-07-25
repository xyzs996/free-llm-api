import { publicProbeError, runProbeCli } from '../src/run-probe.js';

try {
  await runProbeCli();
} catch (error) {
  process.stderr.write(`${publicProbeError(error)}\n`);
  process.exitCode = 1;
}
