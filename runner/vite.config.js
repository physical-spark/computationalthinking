import {defineConfig} from 'vite';
export default defineConfig({worker:{format:'es'},build:{target:'es2022'},server:{headers:{'Cross-Origin-Resource-Policy':'cross-origin'}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
