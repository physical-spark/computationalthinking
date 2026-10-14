import {useEffect,useRef} from 'react';
import {EditorView,keymap} from '@codemirror/view';
import {basicSetup} from 'codemirror';
import {python} from '@codemirror/lang-python';
import {oneDark} from '@codemirror/theme-one-dark';
export default function Editor({value,onChange,onRun,shell}:{value:string;onChange:(v:string)=>void;onRun:()=>void;shell:boolean}){
 const host=useRef<HTMLDivElement>(null);const view=useRef<EditorView|null>(null);const latest=useRef({onChange,onRun,shell});latest.current={onChange,onRun,shell};const history=useRef<string[]>([]);const position=useRef(0);
 function execute(){if(latest.current.shell&&view.current){const code=view.current.state.doc.toString();if(history.current.at(-1)!==code)history.current.push(code);position.current=history.current.length;}latest.current.onRun();return true;}
 useEffect(()=>{if(!host.current)return;const v=new EditorView({parent:host.current,doc:value,extensions:[keymap.of([{key:'Enter',run:v=>latest.current.shell&&!v.state.doc.toString().includes('\n')?execute():false},{key:'ArrowUp',run:()=>{if(!latest.current.shell||!history.current.length)return false;position.current=Math.max(0,position.current-1);latest.current.onChange(history.current[position.current]);return true;}},{key:'ArrowDown',run:()=>{if(!latest.current.shell||!history.current.length)return false;position.current=Math.min(history.current.length,position.current+1);latest.current.onChange(history.current[position.current]||'');return true;}},{key:'Ctrl-Enter',run:execute},{key:'Cmd-Enter',run:execute}]),basicSetup,python(),oneDark,EditorView.contentAttributes.of({'aria-label':'Python 코드 편집기'}),EditorView.updateListener.of(u=>{if(u.docChanged)latest.current.onChange(u.state.doc.toString());}),EditorView.lineWrapping]});view.current=v;return()=>v.destroy();},[]);
 useEffect(()=>{const v=view.current;if(v&&v.state.doc.toString()!==value)v.dispatch({changes:{from:0,to:v.state.doc.length,insert:value}});},[value]);
 return <div className="editor" ref={host}/>;
}
