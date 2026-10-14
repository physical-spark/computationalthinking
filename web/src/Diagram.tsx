import {useEffect,useState} from 'react';
const examples=[
 {title:'입력하면 계산하고 결과를 보여줘요',labels:['1 + 2','Python으로 계산','3'],caption:'코드가 입력이고, 계산을 거친 값이 출력입니다.'},
 {title:'글자들이 모이면 문자열이 돼요',labels:['"Hello"','문자열 + 문자열','"HelloWorld"'],caption:'따옴표 안의 글자는 데이터입니다. +로 문자열을 이어 붙일 수 있습니다.'},
 {title:'이름으로 값을 다시 찾아요',labels:['word = "Hello"','word라는 이름','"Hello"'],caption:'변수 이름을 읽으면 그 이름이 가리키는 값을 사용합니다.'},
 {title:'같은 동작을 하나씩 반복해요',labels:['"ABC"','A · B · C를 하나씩','print(character)'],caption:'for는 입력의 항목을 하나씩 꺼내 같은 동작을 반복합니다.'},
 {title:'조건에 따라 실행할 길이 달라져요',labels:['failures = 3','failures >= 3 ?','확인 대상'],caption:'조건이 참일 때만 들여쓴 코드가 실행됩니다.'},
 {title:'순서가 있는 값들을 함께 보관해요',labels:['["a", "b", "c"]','위치 0 · 1 · 2','items[1] → "b"'],caption:'리스트는 여러 값을 순서대로 담고, 위치 번호는 0부터 시작합니다.'},
 {title:'문자열 안에서 필요한 부분을 찾아요',labels:['"Hello World"','문자·부분 문자열','"World"'],caption:'문자열도 순서가 있습니다. 위치와 결합을 이용해 필요한 표현을 만듭니다.'},
 {title:'반복 안에서도 다시 반복할 수 있어요',labels:['행 1 · 행 2','각 행에서 열 반복','모든 칸 확인'],caption:'바깥 반복 한 번마다 안쪽 반복 전체가 실행됩니다.'},
 {title:'작은 기능에 이름을 붙여 재사용해요',labels:['입력 값','함수의 처리','반환 값'],caption:'함수는 입력을 받아 처리합니다. print와 return의 역할은 다릅니다.'},
 {title:'여러 조건을 연결해 판단해요',labels:['조건 A · 조건 B','and · or · not','True / False'],caption:'and는 두 조건 모두, or는 적어도 하나가 참인지 확인합니다.'},
 {title:'큰 문제를 작은 규칙으로 나눠요',labels:['현재 게임판','승리·차례·입력 확인','다음 게임판'],caption:'틱택토는 상태, 반복, 함수, 조건을 함께 사용하는 프로젝트입니다.'},
 {title:'키를 알면 대응하는 값을 찾을 수 있어요',labels:['{"user": "ana"}','"user" 키로 조회','"ana"'],caption:'딕셔너리는 키와 값을 짝지어 보관합니다. 리스트의 위치 번호와 구분해 보세요.'},
];
export default function Diagram({index,concept}:{index:number;concept:string}){
 const [stage,setStage]=useState(0);const [narrow,setNarrow]=useState(matchMedia('(max-width:520px)').matches);useEffect(()=>{const m=matchMedia('(max-width:520px)');const changed=()=>setNarrow(m.matches);m.addEventListener('change',changed);return()=>m.removeEventListener('change',changed);},[]);const example=examples[index]||{title:concept,labels:['샘플 입력','내가 작성한 함수','확인할 결과'],caption:'모의실습은 정해진 입력으로 처리 흐름을 확인합니다. 실제 외부 서비스에 연결하지 않습니다.'};
 return <figure className="diagram"><figcaption>{example.title}</figcaption><svg viewBox={narrow?"0 0 300 338":"0 0 600 138"} role="img" aria-label={example.labels.join(' 다음 ')}><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3z" fill="currentColor"/></marker></defs>{example.labels.map((label,i)=><g key={label}><rect x={narrow?10:i*200+8} y={narrow?i*105+15:25} width={narrow?280:180} height="72" rx="12" className={i===stage?'active-box':'diagram-box'}/><text x={narrow?150:i*200+98} y={narrow?i*105+43:55} textAnchor="middle" className="diagram-label">{['입력','처리','출력'][i]}</text><text x={narrow?150:i*200+98} y={narrow?i*105+68:79} textAnchor="middle">{label}</text>{i<2&&<path d={narrow?`M150,${i*105+87}v29`:`M${i*200+188},61h17`} stroke="currentColor" markerEnd="url(#arrow)"/>}</g>)}</svg><p>{example.caption}</p><div className="diagram-controls" aria-label="그림의 단계">{['입력 보기','처리 보기','출력 보기'].map((label,i)=><button key={label} aria-pressed={stage===i} onClick={()=>setStage(i)}>{label}</button>)}</div></figure>;
}
