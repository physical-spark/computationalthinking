import {defineConfig} from "vite";
import {readdirSync, readFileSync} from "node:fs";
import {join, relative} from "node:path";
export default defineConfig({
  publicDir:false,
  plugins:[{name:"birdseye-assets",generateBundle(){
    const root="public/birdseye";
    const walk=(dir)=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else this.emitFile({type:"asset",fileName:"birdseye/"+relative(root,p),source:readFileSync(p)});}};
    walk(root);
  }}],
  build:{target:"es2022",rollupOptions:{input:{main:"index.html",debug:"debug.html"}}},
  server:{headers:{"Cross-Origin-Resource-Policy":"cross-origin"}}
});
