// Vite config for the e2e run only: the normal config + no HMR / no file watching, so edits
// other departments make in src/ during a test run do not reload the page mid-test.
// The server serves a consistent snapshot of src/ from its first request on.
import { defineConfig, mergeConfig } from 'vite';
import base from '../../vite.config';

export default mergeConfig(
  base,
  defineConfig({
    server: { hmr: false, watch: { ignored: ['**/*'] } },
  }),
);
