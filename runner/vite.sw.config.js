import {defineConfig} from 'vite';
export default defineConfig({build:{emptyOutDir:false,target:'es2022',lib:{entry:'src/sw.js',formats:['iife'],name:'CTServiceWorker',fileName:()=> 'service-worker.js'}}});
