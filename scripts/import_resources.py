"""Freeze Run of Show video placements; never copy teacher notes or learner records."""
import json
import subprocess
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "course-network"
# Authored explanations contextualize the source's topics for self-paced learning.
TOPICS = {
"variables": ("IntroducingVariables", "값에 이름 붙이기", "같은 값을 여러 곳에서 사용한다면 이름을 붙여 관리할 수 있습니다. 이름과 지금 담긴 값을 구분하고, 값이 바뀐 뒤 어떤 계산이 달라질지 예상해 보세요.", "값을 저장하는 이름과 실제 값을 구분해 보세요."),
"conditions": ("IntroducingIfStatements", "조건으로 경우 나누기", "조건은 참이나 거짓으로 판단할 수 있는 기준입니다. 기준을 정한 다음 각 경우에 할 일을 나누면 사람의 판단을 컴퓨터가 실행할 절차로 표현할 수 있습니다.", "조건의 경계값과 조건을 검사하는 순서를 확인해 보세요."),
"elif": ("IntroducingElif", "여러 경우의 검사 순서", "여러 조건이 동시에 참이어도 if와 elif는 처음 참인 갈래 하나만 실행합니다. 구체적인 조건과 넓은 조건의 순서를 바꾸면 같은 입력도 다른 결과를 냅니다.", "조건 순서를 바꾸면 달라지는 입력을 하나 떠올려 보세요."),
"operators": ("IntroducingTheShell", "식을 작은 계산으로 나누기", "식의 결과를 예상할 때는 값뿐 아니라 연산자의 의미와 계산 순서도 확인해야 합니다. 괄호로 작은 계산을 묶어 어떤 계산이 먼저 수행되는지 표현해 보세요.", "곱셈과 덧셈의 순서가 어떻게 정해지는지 확인해 보세요."),
"loops": ("IntroducingForLoops", "반복되는 규칙 찾기", "여러 항목에 같은 일을 한다면 항목마다 코드를 다시 쓸 필요가 없습니다. 바뀌는 항목과 반복할 작업을 분리하면 데이터가 늘어나도 같은 절차를 사용할 수 있습니다.", "매번 바뀌는 값과 그대로 반복되는 일을 구분해 보세요."),
"range": ("GettingElementsAtPosition", "반복할 범위 정하기", "반복 횟수와 항목의 위치는 구분해야 합니다. range의 시작과 끝을 살펴보고 마지막 값이 포함되는지 작은 예로 검증해 보세요.", "첫 값과 마지막 값, 실행 횟수를 예상해 보세요."),
"while": ("IntroducingForLoops", "조건이 유지되는 동안 반복하기", "while은 조건이 참인 동안 같은 작업을 반복합니다. 반복 중 어떤 값이 바뀌는지와 언제 조건이 거짓이 되는지를 함께 설계해야 끝나지 않는 반복을 피할 수 있습니다.", "반복을 끝내는 조건과 그 조건을 바꾸는 문장을 찾아보세요."),
"dict": ("IntroducingDictionaries", "이름으로 데이터 찾기", "딕셔너리는 키와 값을 짝지어 저장합니다. 위치 대신 의미 있는 이름으로 데이터를 찾으면 기록마다 항목 순서가 달라도 같은 규칙으로 처리할 수 있습니다.", "키와 값이 각각 무엇을 의미하는지 설명해 보세요."),
"set": ("IntroducingDictionaries", "중복의 의미 생각하기", "세트는 같은 값을 한 번만 남깁니다. 중복을 없애도 되는 문제인지 먼저 판단해야 합니다. 사용자 수를 셀 때와 접속 횟수를 셀 때는 중복의 의미가 다릅니다.", "중복을 지우면 잃는 정보가 있는지 확인해 보세요."),
"function": ("DefiningFunctions", "작은 작업에 이름 붙이기", "함수는 여러 문장으로 이루어진 작업에 이름을 붙입니다. 입력, 처리, 반환 결과를 분리해 생각하면 큰 문제를 작은 기능으로 나누고 각각 검증할 수 있습니다.", "함수가 받는 입력과 돌려주는 결과를 구분해 보세요."),
"return": ("ReturningValuesFromFunctions", "결과를 다음 작업에 전달하기", "화면에 보여주는 일과 결과를 반환하는 일은 다릅니다. 반환값은 다른 함수나 계산의 입력으로 연결할 수 있어 작은 기능을 조합하는 데 쓰입니다.", "print와 return의 역할이 어떻게 다른지 확인해 보세요."),
"defaults": ("DefiningFunctions", "기본값으로 반복 줄이기", "자주 사용하는 입력값을 기본값으로 정하면 호출할 때 필요한 정보만 전달할 수 있습니다. 값을 생략했을 때와 직접 지정했을 때의 결과를 비교해 보세요.", "생략한 입력에 어떤 값이 사용되는지 확인해 보세요."),
"files": ("m1-day2", "기록을 읽고 구조화하기", "파일을 읽으면 먼저 문자열을 얻습니다. 줄과 항목을 나누고 각 값의 의미를 정해 구조화해야 후속 계산에 사용할 수 있습니다. 여기 실습에서는 가상 파일과 제공된 문자열을 사용합니다.", "읽기, 분리, 변환의 순서를 찾아보세요."),
"modules": ("m1-day7", "기능을 나누고 연결하기", "기능을 모듈로 나누면 전체 흐름과 세부 처리를 따로 이해할 수 있습니다. 각 기능이 받는 데이터와 돌려주는 데이터가 맞아야 파이프라인이 이어집니다.", "기능 사이의 입력과 출력이 맞는지 확인해 보세요."),
"exceptions": ("m1-day2", "예상한 실패 다루기", "입력 형식이 다르거나 필요한 값이 없으면 처리가 실패할 수 있습니다. 정상 처리와 실패했을 때의 행동을 나누면 한 항목의 오류 때문에 전체 작업이 멈추는 일을 줄일 수 있습니다.", "어떤 실패를 처리하고 어떤 실패를 드러내야 할지 생각해 보세요."),
"regex": ("m1-day1", "문자열의 공통 패턴 찾기", "정규표현식은 문자열의 형태를 규칙으로 표현합니다. 먼저 찾으려는 예와 찾으면 안 되는 예를 적고 규칙이 둘을 구분하는지 확인하는 습관이 중요합니다.", "규칙에 맞는 예와 반례를 하나씩 만들어 보세요."),
"api": ("m1-day4", "요청과 응답의 약속", "API는 다른 기능에 요청하고 결과를 받는 약속입니다. 요청의 입력, 응답의 구조, 실패의 표현을 구분하면 서비스가 달라져도 수집 절차를 설계할 수 있습니다. 실습은 모의 응답으로 진행합니다.", "요청하는 쪽과 응답하는 쪽의 책임을 구분해 보세요."),
"http": ("m1-day4", "성공과 실패를 분류하기", "같은 요청이라도 성공, 입력 오류, 서버 오류처럼 서로 다른 응답이 올 수 있습니다. 상태를 분류하고 각 경우의 다음 행동을 정하면 수집기가 불완전한 상황도 다룰 수 있습니다.", "다시 시도할 경우와 입력을 고칠 경우를 나눠 보세요."),
"cli": ("IntroducingTheShell", "명령을 입력으로 표현하기", "화면의 버튼과 텍스트 명령은 모두 컴퓨터에 일을 요청하는 방법입니다. 명령을 글자로 남기면 같은 절차를 다시 실행하고 다른 사람과 비교하기 쉽습니다.", "한 번의 조작을 재현 가능한 입력으로 표현해 보세요."),
"schedule": ("m1-day5", "언제 실행할지 규칙으로 정하기", "이벤트가 도착했을 때 실행하는 방식과 정해진 시간에 실행하는 방식은 시작 조건이 다릅니다. 같은 이벤트의 중복 실행도 고려해야 합니다. 영상의 운영체제 설정은 참고 사례이며 실습은 가상 시계를 사용합니다.", "시작 조건과 중복 실행을 구분해 보세요."),
"llm": ("m1-day6", "모델의 응답과 프로그램의 판단", "언어 모델의 응답은 프로그램에서 그대로 믿고 실행할 명령이 아닙니다. 허용한 형식과 도구인지 검사한 뒤 사용해야 합니다. 여기서는 비용이 발생하지 않는 모의 응답을 사용합니다.", "모델의 제안과 프로그램이 허용하는 동작을 구분해 보세요."),
"json": ("m1-day3", "데이터를 공통 형태로 표현하기", "JSON은 구조화한 값을 주고받는 표현 방식입니다. 문자열을 구조화된 값으로 읽는 파싱과 값을 문자열로 만드는 직렬화는 반대 방향입니다. 공통 형식으로 바꾸기 전에 원본 항목의 의미를 확인하세요.", "문자열과 구조화된 값이 바뀌는 지점을 찾아보세요."),
"markdown": ("m1-day7", "결과를 읽을 수 있는 보고서로", "보고서는 계산 결과를 사람이 이해할 수 있도록 구조화한 출력입니다. 제목, 목록, 표를 정하기 전에 읽는 사람이 어떤 판단을 해야 하는지부터 생각해 보세요.", "데이터 계산과 문서 표현을 분리해 보세요."),
"github": ("m1-day8", "변경을 기록하고 검증하기", "코드의 변경 이유와 확인 결과를 함께 남기면 이전 상태와 비교하거나 다른 사람이 이어서 작업할 수 있습니다. 영상 속 외부 도구 설정은 참고 사례이며 이 실습의 제출 조건은 아닙니다.", "변경 내용과 검증 근거를 함께 설명해 보세요."),
"network": (None, "데이터가 이동하는 경로", "네트워크는 여러 장치와 규칙이 함께 동작하는 시스템입니다. 출발지, 목적지, 중간 장치, 각 단계의 역할을 나눠 살펴보면 연결 문제의 원인을 좁힐 수 있습니다. 설치와 장비 조작은 이 읽기 과정의 필수가 아닙니다.", "어느 단계에서 무엇을 확인하면 원인을 좁힐 수 있을지 생각해 보세요."),
}
MAP = dict(zip(
"uqiHrVAp2ow BiaDwCKRyxg J9srd8Mfoyc N92M3WaLbH0 XlrRQXP9GD0 HpiyWggNgyU uecZdRyiFNA ZLp_Wg6VxfA sJrv25QnRFk HgylrKz95tQ poqZPwrBAec dJHiMzWFMwI LV4IQnllYBA YTEr1VTbe4Q DhBNQ4RqQQY oM-MBmAvYkM e0hEA69d4Dw 2JQ24B3OVZU o1sTax907Dc pVSS02HUnRA FFuubo7JXOU 2P0oSNguGXI ckSdPNKM2pY QcKEJFvPryI 5AUeGcZqZgU HnvitMTkXro r7kU1OoUEQg esDYb0gYOxQ QfN7EKsCR0g eu5H0iRJsJ4 kMEb_BzyUqk SZcjvjrdomE".split(),
"cli variables elif conditions operators conditions loops dict range while set set dict function return defaults function files files modules exceptions regex api http schedule llm llm json json llm markdown github".split()))

class Extract(HTMLParser):
    def __init__(self):
        super().__init__(); self.items=[]; self.anchor=""
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag == "div" and "concept" in a.get("class", "").split() and a.get("id"):
            self.anchor=a["id"]
        if tag == "iframe" and "youtube.com/embed/" in a.get("src", ""):
            self.items.append((a["src"],a.get("title", ""),self.anchor))

def main():
    existing_path=ROOT/"content/resources.json"
    existing=json.loads(existing_path.read_text())["resources"] if existing_path.exists() else []
    authors={r['video_id']:(r.get('creator'),r.get('creator_url')) for r in existing}
    revision=subprocess.check_output(["git","rev-parse","HEAD"],cwd=SOURCE,text=True).strip()
    course=json.loads((ROOT/"content/course.json").read_text())
    ids={p['id'] for p in course['pages']}
    # Resolve names against the fixed course catalog, never by display-order indexes.
    aliases={"m1-day"+str(i+1):p['id'] for i,p in enumerate(p for p in course['pages'] if p['track']=='module1')}
    resources=[]
    for file in sorted((SOURCE/"studio/run_of_show").glob("*.html")):
        parser=Extract();parser.feed(file.read_text())
        for index,(url,title,anchor) in enumerate(parser.items):
            parsed=urlparse(url);video=parsed.path.split('/')[-1];params=parse_qs(parsed.query)
            topic=MAP.get(video,"network");page,heading,reading,after=TOPICS[topic]
            page=aliases.get(page,page)
            if page and page not in ids:
                raise ValueError(page)
            source=f"https://course-studio.futurereadycampus.com/course-network/run_of_show/{file.name}#{anchor}"
            network_groups={"1012-am":("network-layers","네트워크 계층과 역할","데이터를 보내는 일을 여러 계층의 역할로 나누면 복잡한 통신을 이해하기 쉬워집니다. 같은 데이터에 주소와 제어 정보가 붙는 캡슐화 과정을 따라가고, 각 단계가 맡은 일을 구분해 보세요."),"1012-pm":("network-tcp","TCP와 패킷 관찰","TCP 연결에서는 데이터를 보내기 전에 상대와 상태를 확인합니다. 패킷을 시간순으로 관찰하면 연결 설정과 데이터 전달을 구분할 수 있습니다. 영상의 Wireshark 설치는 참고이며 직접 설치할 필요는 없습니다."),"1013-am":("network-address","IP 주소와 서브넷","IP 주소는 통신할 대상을 찾는 데 쓰입니다. 주소와 네트워크 범위를 나누어 생각하고, 목적지가 같은 네트워크 안인지 밖인지에 따라 경로가 어떻게 달라지는지 살펴보세요."),"1013-pm":("network-routing","스위치·VLAN·라우팅","같은 네트워크 안에서 전달하는 일과 다른 네트워크로 전달하는 일은 구분됩니다. 스위치, 라우터, VLAN의 역할을 나누고 각 장치가 어떤 정보를 기준으로 다음 경로를 결정하는지 살펴보세요."),"1014-am":("network-dns","DNS와 이름 해석","사람이 사용하는 이름과 컴퓨터가 통신에 사용하는 주소를 연결하는 과정이 DNS입니다. 요청과 응답의 순서, 캐시, 레코드 종류를 구분하면 이름으로는 연결되지 않는 문제의 원인을 좁힐 수 있습니다.")}
            if topic=='network':
                topic,heading,reading=network_groups[file.stem[:7]]
                after="입력한 정보가 어떤 단계를 거쳐 결과로 이어졌는지, 확인할 지점을 하나 골라 설명해 보세요."
            creator,creator_url=authors.get(video,("YouTube 원 제작자 (원본 영상에서 확인)",None))
            resources.append(dict(id=f"ros-{file.stem}-{anchor or index}-{video}",page_id=page,topic=topic,title=title,group_title=heading,
                video_id=video,start=int(params.get('start',[0])[0]),end=int(params['end'][0]) if 'end' in params else None,
                before=f"{heading}. 이 영상에서 작은 규칙이 실제 예에 어떻게 적용되는지 살펴보세요.",reading=reading,after=after,
                source_url=source,source_file=str(file.relative_to(SOURCE)),source_anchor=anchor,source_revision=revision,
                creator=creator,creator_url=creator_url,reference_only=topic in {'schedule','github'} or topic.startswith('network')))
    assert len(resources)==50 and len({r['video_id'] for r in resources})==46
    (ROOT/"content/resources.json").write_text(json.dumps({"source_revision":revision,"resources":resources},ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__': main()
