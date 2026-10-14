"""Resumable local translation. Original code and expected outputs never change."""
import json,re,urllib.request
from pathlib import Path
import polib
ROOT=Path(__file__).resolve().parents[1]
po=polib.pofile(str(ROOT/'vendor/futurecoder/translations/english.po'))
out=ROOT/'content/ko.json';done=json.loads(out.read_text()) if out.exists() else {}
overrides=json.loads((ROOT/'content/ko-overrides.json').read_text())
pattern=re.compile(r'```[\s\S]*?```|(?:^ {4,}.*(?:\n|$))+|`[^`\n]+`|__\w+__|\$?\{[^{}\n]*\}|https?://[^\s)]+|(?<=\]\()[^)]*(?=\))',re.MULTILINE)
errors={};cache={e.msgstr:done[e.msgid]['text'] for e in po if e.msgid in done}
def code_blocks(s):return re.findall(r'(?:^ {4,}.*(?:\n|$))+',s,re.MULTILINE)
def translate(source):
    if source in cache:return cache[source]
    tokens=[]
    def mask(m):tokens.append(m[0]);return f'ZXQ{len(tokens)-1:04d}QXZ'
    masked=pattern.sub(mask,source)
    prompt='<|im_start|>system\nTranslate the supplied English text into Korean. Use polite Korean (하세요, 합니다). Translate all prose without summarizing or adding explanations. Preserve Markdown and all ZXQ tokens exactly. Return only the translation.\n<|im_end|>\n<|im_start|>user\n'+masked+'\n<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n'
    payload={'model':'qwen3:8b','raw':True,'prompt':prompt,'stream':False,'options':{'temperature':0,'num_ctx':8192,'num_predict':min(4096,max(256,len(source)*2)),'stop':['<|im_end|>']}}
    request=urllib.request.Request('http://127.0.0.1:11434/api/generate',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=240) as response:result=json.load(response)['response'].strip()
    for i,token in enumerate(tokens):
        marker=f'ZXQ{i:04d}QXZ'
        if result.count(marker)!=1:raise ValueError('placeholder mismatch')
        result=result.replace(marker,token)
    if re.search(r'ZXQ\d+QXZ',result):raise ValueError('unknown placeholder')
    if not re.search('[가-힣]',result):raise ValueError('no Korean')
    if len(result)>max(120,len(source)*2.5) or '<think>' in result or '</think>' in result:raise ValueError('expanded or reasoning text')
    if len(source)>100 and len(result)<len(source)*.15:raise ValueError('truncated')
    if sorted(re.findall(r'`[^`\n]+`',result))!=sorted(re.findall(r'`[^`\n]+`',source)):raise ValueError('inline code mismatch')
    cache[source]=result
    return result
for n,e in enumerate(po):
    if e.msgid in overrides:continue
    if e.msgid in done and sorted(code_blocks(done[e.msgid]['text']))==sorted(code_blocks(e.msgstr)):continue
    try:
        if e.msgid.startswith('code_bits.') or e.msgid.endswith('.program') or '.output_prediction_choices.' in e.msgid or not re.search('[A-Za-z]{3}',pattern.sub('',e.msgstr)):
            done[e.msgid]={'text':e.msgstr,'status':'code-preserved'}
        else:done[e.msgid]={'text':translate(e.msgstr),'status':'machine-draft'}
    except Exception as error:errors[e.msgid]=str(error);print('ERROR',n,e.msgid,str(error),flush=True);continue
    out.write_text(json.dumps(done,ensure_ascii=False,indent=2)+'\n')
    if n%10==0:print(f'{n+1}/{len(po)} source terms, {len(done)} drafts, {len(overrides)} reviewed overrides',flush=True)
(ROOT/'content/translation-errors.json').write_text(json.dumps(errors,ensure_ascii=False,indent=2)+'\n')
print('DONE',len(done),'drafts, errors',len(errors),flush=True)
