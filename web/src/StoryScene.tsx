import { useId, useState } from "react";
import type { ReactNode } from "react";
import "./story-scenes.css";

type Story = { title: string; steps: [string, string, string]; action: string };
export const storyScenes: Story[] = [
  {
    title: "사과가 모두 몇 개일까요?",
    steps: [
      "사과 한 개와 두 개가 있어요.",
      "한곳에 모아 볼까요?",
      "하나, 둘, 셋! 1 + 2는 3이에요.",
    ],
    action: "사과 모으기",
  },
  {
    title: "글자 카드로 인사를 만들어요",
    steps: [
      "‘안녕’ 카드와 ‘친구’ 카드를 놓아요.",
      "두 카드를 옆으로 붙여요.",
      "‘안녕친구’가 되었어요. 글도 이어 붙일 수 있어요.",
    ],
    action: "카드 붙이기",
  },
  {
    title: "이름표로 간식을 찾아요",
    steps: [
      "snack이라는 이름표가 사과를 가리켜요.",
      "이름표가 바나나를 가리키게 바꿔요.",
      "이제 snack을 읽으면 바나나를 찾아요. 이름표가 가리키는 값을 바꾼 거예요.",
    ],
    action: "이름표 옮기기",
  },
  {
    title: "망치질을 한 번, 또 한 번!",
    steps: [
      "못 세 개를 하나씩 박아 볼까요?",
      "첫 번째 못을 박았어요. 다음 못으로 가요.",
      "같은 일을 세 번 했더니, 못이 모두 박혔어요.",
    ],
    action: "못 박기",
  },
  {
    title: "비가 오면 우산을 챙겨요",
    steps: [
      "밖으로 나가기 전에 하늘을 봐요.",
      "비가 오네요. 우산을 챙길까요?",
      "비가 오므로 우산을 챙겨요. 조건을 보고 할 일을 골랐어요.",
    ],
    action: "하늘 확인하기",
  },
  {
    title: "선반에서 두 번째 간식을 찾아요",
    steps: [
      "선반에 사과, 바나나, 귤이 차례로 있어요.",
      "Python은 첫 칸에 0, 다음 칸에 1을 붙여요.",
      "1번 칸을 찾으면 두 번째 간식인 바나나가 나와요.",
    ],
    action: "1번 칸 찾기",
  },
  {
    title: "안내판에 숫자를 넣어요",
    steps: [
      "가게에 물건이 3개 남았어요. 안내판에 적어 볼까요?",
      "안내판의 빈자리에 count 값인 3을 넣어요.",
      "‘3 items’가 되었어요. 문장 틀에 값을 끼워 넣은 거예요. items는 물건들이라는 뜻이에요.",
    ],
    action: "숫자 넣기",
  },
  {
    title: "화분에 물을 빠짐없이 줘요",
    steps: [
      "화분이 두 줄로 놓여 있어요.",
      "첫 줄의 화분 세 개에 차례로 물을 줘요.",
      "다음 줄에서도 같은 일을 해요. 두 줄, 세 개씩 모두 여섯 개예요.",
    ],
    action: "물 주기",
  },
  {
    title: "토스트 만드는 방법에 이름을 붙여요",
    steps: [
      "빵을 넣고, 굽고, 꺼내는 방법을 적어요.",
      "이 방법을 ‘토스트 만들기’라고 부르기로 해요.",
      "다음에는 이름만 부르면 같은 방법으로 다시 만들 수 있어요.",
    ],
    action: "토스트 만들기",
  },
  {
    title: "준비가 모두 끝나면 출발해요",
    steps: [
      "소풍을 가려면 신발도 신고, 가방도 메야 해요.",
      "신발은 신었지만 가방이 없네요. 아직 기다려요.",
      "신발도, 가방도 준비됐어요. 두 조건이 모두 맞아 출발해요!",
    ],
    action: "준비 확인하기",
  },
  {
    title: "세 칸을 채우면 이겨요",
    steps: [
      "친구와 번갈아 표시를 놓는 게임이에요.",
      "같은 표시가 한 줄에 두 개 있어요.",
      "세 번째 칸도 채웠어요. 한 줄이 모두 같으면 이겨요!",
    ],
    action: "표시 놓기",
  },
  {
    title: "이름을 부르면 짝을 찾아요",
    steps: [
      "민지의 간식은 사과, 준호의 간식은 바나나예요.",
      "‘준호’라는 이름을 찾아볼까요?",
      "준호와 짝인 바나나를 찾았어요. 이름과 값을 짝지어 둔 거예요.",
    ],
    action: "준호 간식 찾기",
  },
  {
    title: "도움이 필요한 기록만 모아요",
    steps: [
      "배달 기록에 완료 두 개와 실패 한 개가 있어요.",
      "각 기록을 보며 ‘실패인가?’ 하고 물어요.",
      "실패 기록만 남았어요. 이제 어디를 살필지 알 수 있어요.",
    ],
    action: "실패 기록 고르기",
  },
  {
    title: "긴 기록을 작은 카드로 나눠요",
    steps: [
      "한 종이에 이름과 결과가 줄마다 적혀 있어요.",
      "줄을 하나씩 나누고, 쉼표에서 다시 나눠요.",
      "이름과 결과가 따로 담겼어요. 필요한 내용을 찾기 쉬워졌어요.",
    ],
    action: "기록 나누기",
  },
  {
    title: "다른 이름표를 같은 이름으로 맞춰요",
    steps: [
      "한 기록에는 ‘username’, 다른 기록에는 ‘user’라고 적혔어요.",
      "둘 다 사람 이름을 뜻하므로 이름표를 ‘user’로 맞춰요.",
      "같은 모양으로 정리하니 두 기록을 함께 읽기 쉬워요.",
    ],
    action: "이름표 맞추기",
  },
  {
    title: "한 장씩 받아 함께 모아요",
    steps: [
      "가게에서 목록을 한 장씩 보내 줘요. 여기서는 연습용 가게예요.",
      "잘 받은 장의 물건은 모으고, 못 받은 장은 따로 표시해요.",
      "잘 받은 물건 세 개와 실패한 요청 한 개를 구분했어요.",
    ],
    action: "다음 장 받기",
  },
  {
    title: "아직 안내를 보낼 때가 아니에요",
    steps: [
      "안내 a를 12시에 보내기로 했어요. 지금은 몇 시일까요?",
      "지금은 10시예요. 약속한 12시보다 이르네요.",
      "아직 기다려요. 지금 시각이 예약 시각보다 이르면 안내를 보내지 않아요.",
    ],
    action: "시계 확인하기",
  },
  {
    title: "허락한 도구인지 먼저 살펴요",
    steps: [
      "연습용 AI가 사용할 도구 이름을 보내요.",
      "‘search’는 허락한 도구 목록에 있어요.",
      "‘delete’는 목록에 없어요. 모르는 도구는 실행하지 않아요.",
    ],
    action: "도구 이름 확인하기",
  },
  {
    title: "기록 세 장을 짧게 요약해요",
    steps: [
      "민지가 두 번, 준호가 한 번 실패한 기록이 있어요.",
      "기록 장수와 사람 수를 따로 세어 봐요.",
      "실패는 세 번, 실패한 사람은 두 명이에요. 세는 대상이 달라요.",
    ],
    action: "하나씩 세기",
  },
  {
    title: "작은 일을 이어 보고서를 만들어요",
    steps: [
      "기록을 모으는 일부터 시작해요.",
      "모양을 맞춘 뒤 필요한 내용을 세어요.",
      "모으기, 정리하기, 세기를 연결하니 한 장의 보고서가 됐어요.",
    ],
    action: "다음 일 하기",
  },
];
const ink = "var(--text)",
  accent = "var(--accent)",
  pale = "var(--accent-soft)",
  peach = "var(--illustration-highlight)",
  paper = "var(--surface)",
  coral = "var(--danger)";
function Label({
  x,
  y,
  children,
  size = 24,
  fill = ink,
}: {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  fill?: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: size, fill, fontFamily: "inherit", fontWeight: 650 }}
    >
      {children}
    </text>
  );
}
function Emoji({
  x,
  y,
  children,
  size = 48,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
}) {
  return (
    <Label x={x} y={y} size={size}>
      {children}
    </Label>
  );
}
function Card({
  x,
  y,
  w = 100,
  h = 84,
  active = false,
  children,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={16}
        fill={active ? pale : paper}
        stroke={active ? accent : "var(--control-border)"}
        strokeWidth={active ? 3 : 2}
      />
      {children}
    </g>
  );
}
function Tick({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill="var(--success)" />
      <path
        d={`M${x - 7},${y}l5,5 9,-10`}
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
function Arrow({ x, y, w = 45 }: { x: number; y: number; w?: number }) {
  return (
    <path
      d={`M${x},${y}h${w}m-9,-7 9,7 -9,7`}
      fill="none"
      stroke={accent}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Scene({ index, step }: { index: number; step: number }) {
  const done = step === 2;
  switch (index) {
    case 0:
      return (
        <>
          <ellipse cx={240} cy={161} rx={181} ry={40} fill={peach} />
          {[0, 1, 2].map((i) => (
            <Emoji key={i} x={step ? 165 + i * 75 : [108, 295, 370][i]} y={124}>
              🍎
            </Emoji>
          ))}
          <Label x={240} y={205}>
            {done ? "1 + 2 = 3" : "1 + 2 = ?"}
          </Label>
          {done && <Tick x={376} y={192} />}
        </>
      );
    case 1:
      return (
        <>
          {["안녕", "친구"].map((text, i) => (
            <Card
              key={text}
              x={step ? 120 + i * 120 : 70 + i * 230}
              y={72}
              w={120}
              h={100}
              active={done}
            >
              <Label x={step ? 180 + i * 120 : 130 + i * 230} y={122} size={32}>
                {text}
              </Label>
            </Card>
          ))}
          {!step && (
            <Label x={240} y={120} size={34}>
              +
            </Label>
          )}
          <Label x={240} y={207}>
            {done ? '"안녕" + "친구"' : "두 장의 글자 카드"}
          </Label>
        </>
      );
    case 2:
      return (
        <>
          <rect
            x={165}
            y={28}
            width={150}
            height={48}
            rx={10}
            fill={paper}
            stroke={ink}
            strokeWidth={2}
          />
          <Label x={240} y={53}>
            snack
          </Label>
          <path
            d={
              step
                ? "M240 77 Q240 103 330 113l-11,-1m11,1 -6,-9"
                : "M240 77 Q240 103 150 113l11,-1m-11,1 6,-9"
            }
            stroke={accent}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Card x={90} y={125} w={120} h={72} active={!step}>
            <Emoji x={150} y={162}>
              🍎
            </Emoji>
          </Card>
          <Card x={270} y={125} w={120} h={72} active={step > 0}>
            <Emoji x={330} y={162}>
              🍌
            </Emoji>
          </Card>
          <Label x={240} y={220} size={22}>
            {step ? 'snack → "banana"' : 'snack → "apple"'}
          </Label>
        </>
      );
    case 3:
      return (
        <>
          <rect
            x={48}
            y={156}
            width={384}
            height={30}
            rx={8}
            fill={peach}
            stroke="var(--muted)"
            strokeWidth={2}
          />
          {[0, 1, 2].map((i) => {
            const sunk = done || (step === 1 && i === 0);
            return (
              <g key={i}>
                <path
                  d={`M${120 + i * 120} ${sunk ? 150 : 112}v${sunk ? 4 : 42}m-12,-${sunk ? 4 : 42}h24`}
                  stroke={ink}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {sunk && <Tick x={120 + i * 120} y={95} />}
              </g>
            );
          })}
          <g
            transform={`translate(${step ? (done ? 345 : 112) : 100} ${step ? 40 : 12}) rotate(${step ? 20 : -20})`}
          >
            <rect
              x={-7}
              y={10}
              width={14}
              height={60}
              rx={4}
              fill="var(--code-operator)"
            />
            <rect
              x={-28}
              y={0}
              width={58}
              height={22}
              rx={5}
              fill="var(--muted)"
            />
          </g>
          <Label x={240} y={213}>
            {done
              ? "세 번 끝!"
              : step
                ? "한 번 끝, 다음 못!"
                : "같은 동작을 세 번"}
          </Label>
        </>
      );
    case 4:
      return (
        <>
          <Emoji x={240} y={49} size={56}>
            {step ? "🌧️" : "🌤️"}
          </Emoji>
          <path
            d="M240 87v25m0 0 -105 36m105,-36 105,36"
            stroke={ink}
            strokeWidth={3}
            fill="none"
          />
          <Card x={62} y={142} w={145} h={67} active={done}>
            <Emoji x={100} y={177} size={36}>
              ☂️
            </Emoji>
            <Label x={157} y={177}>
              챙겨요
            </Label>
          </Card>
          <Card x={273} y={142} w={145} h={67}>
            <Emoji x={303} y={177} size={36}>
              ☀️
            </Emoji>
            <Label x={370} y={177} size={20}>
              그냥 가요
            </Label>
          </Card>
          {done && <Tick x={199} y={141} />}
          <Label x={240} y={115} size={22}>
            비가 오나요?
          </Label>
        </>
      );
    case 5:
      return (
        <>
          <rect x={48} y={159} width={384} height={16} rx={5} fill={peach} />
          {["🍎", "🍌", "🍊"].map((v, i) => (
            <g key={v}>
              <Card
                x={60 + i * 125}
                y={69}
                w={110}
                active={step > 0 && i === 1}
              />
              <Emoji x={115 + i * 125} y={111}>
                {v}
              </Emoji>
              <Label x={115 + i * 125} y={198}>
                {i}
              </Label>
            </g>
          ))}
          {done && <Tick x={264} y={70} />}
        </>
      );
    case 6:
      return (
        <>
          <Card x={184} y={20} w={112} h={68} active={step > 0}>
            <Label x={240} y={55} size={28}>
              count: 3
            </Label>
          </Card>
          <path
            d="M240 91v34m-8,-9 8,9 8,-9"
            fill="none"
            stroke={accent}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Card x={65} y={138} w={350} h={75} active={done}>
            <Label x={240} y={177} size={36}>
              {step ? "3 items" : "{count} items"}
            </Label>
          </Card>
          {done && <Tick x={410} y={139} />}
        </>
      );
    case 7:
      return (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const watered = done || (step === 1 && i < 3);
            return (
              <g key={i}>
                <Card
                  x={75 + (i % 3) * 112}
                  y={35 + Math.floor(i / 3) * 92}
                  w={100}
                  h={80}
                  active={watered}
                />
                <Emoji
                  x={125 + (i % 3) * 112}
                  y={76 + Math.floor(i / 3) * 92}
                  size={40}
                >
                  {watered ? "🌻" : "🪴"}
                </Emoji>
                {watered && (
                  <Tick
                    x={159 + (i % 3) * 112}
                    y={47 + Math.floor(i / 3) * 92}
                  />
                )}
              </g>
            );
          })}
          <Label x={240} y={220}>
            {done ? "두 줄 모두 끝!" : "한 줄씩, 하나씩"}
          </Label>
        </>
      );
    case 8:
      return (
        <>
          <Emoji x={72} y={124}>
            🍞
          </Emoji>
          <Arrow x={115} y={123} w={40} />
          <Card x={172} y={60} w={140} h={120} active={step > 0}>
            <Emoji x={242} y={110}>
              🍳
            </Emoji>
            <Label x={242} y={158} size={20}>
              make_toast()
            </Label>
          </Card>
          <Arrow x={325} y={123} w={40} />
          {done ? (
            <Emoji x={412} y={124}>
              🥪
            </Emoji>
          ) : (
            <Label x={411} y={124} size={40}>
              ?
            </Label>
          )}
          <Label x={240} y={211}>
            방법을 묶고 이름을 붙여요
          </Label>
        </>
      );
    case 9:
      return (
        <>
          <Card x={60} y={62} w={140} h={110} active={step > 0}>
            <Emoji x={130} y={116}>
              👟
            </Emoji>
          </Card>
          <Label x={240} y={118} size={25}>
            and
          </Label>
          <Card x={280} y={62} w={140} h={110} active={done}>
            <Emoji x={350} y={116}>
              🎒
            </Emoji>
          </Card>
          {step > 0 && <Tick x={194} y={65} />}
          {done && <Tick x={414} y={65} />}
          <Label x={240} y={209}>
            {done ? "둘 다 준비됐어요. 출발!" : "신발도, 가방도 필요해요"}
          </Label>
        </>
      );
    case 10:
      return (
        <>
          {Array.from({ length: 9 }, (_, i) => (
            <Card
              key={i}
              x={136 + (i % 3) * 70}
              y={13 + Math.floor(i / 3) * 64}
              w={65}
              h={59}
              active={done && i < 3}
            >
              <Label
                x={168 + (i % 3) * 70}
                y={44 + Math.floor(i / 3) * 64}
                size={38}
              >
                {i < 2 || (done && i === 2)
                  ? "○"
                  : [3, 7].includes(i)
                    ? "×"
                    : ""}
              </Label>
            </Card>
          ))}
          {done && (
            <path
              d="M148 44H321"
              stroke={accent}
              strokeWidth={5}
              strokeLinecap="round"
            />
          )}
          <Label x={240} y={222}>
            {done ? "한 줄이 완성됐어요!" : "다음 ○는 어디에 놓을까요?"}
          </Label>
        </>
      );
    case 11:
      return (
        <>
          {["민지", "준호"].map((name, i) => (
            <g key={name}>
              <Card
                x={70}
                y={40 + i * 92}
                w={135}
                h={75}
                active={step > 0 && i === 1}
              >
                <Label x={137} y={79 + i * 92}>
                  {name}
                </Label>
              </Card>
              <path
                d={`M205 ${78 + i * 92}h90`}
                stroke={step > 0 && i === 1 ? accent : "var(--control-border)"}
                strokeWidth={3}
              />
              <Card
                x={295}
                y={40 + i * 92}
                w={115}
                h={75}
                active={step > 0 && i === 1}
              >
                <Emoji x={352} y={79 + i * 92} size={42}>
                  {i ? "🍌" : "🍎"}
                </Emoji>
              </Card>
              {done && i === 1 && <Tick x={411} y={134} />}
            </g>
          ))}
        </>
      );
    case 12:
      return (
        <>
          {["완료", "실패", "완료"].map((v, i) => (
            <g key={i} opacity={done && i !== 1 ? 0.25 : 1}>
              <Card
                x={55 + i * 130}
                y={66}
                w={112}
                h={105}
                active={step > 0 && i === 1}
              >
                <Emoji x={111 + i * 130} y={100} size={38}>
                  {i === 1 ? "📦" : "✅"}
                </Emoji>
                <Label x={111 + i * 130} y={145}>
                  {v}
                </Label>
              </Card>
              {done && i === 1 && <Tick x={237} y={65} />}
            </g>
          ))}
          <Label x={240} y={210}>
            {done ? "도움이 필요한 한 장" : "어떤 배달이 실패했나요?"}
          </Label>
        </>
      );
    case 13:
      return (
        <>
          <Card x={48} y={54} w={170} h={128}>
            <Label x={133} y={96} size={23}>
              ana,OK
            </Label>
            <Label x={133} y={143} size={23}>
              bo,FAIL
            </Label>
          </Card>
          <Arrow x={229} y={119} w={33} />
          <Card x={280} y={39} w={152} h={74} active={step > 0}>
            <Label x={356} y={77} size={23}>
              {step ? "ana  |  OK" : "?"}
            </Label>
          </Card>
          <Card x={280} y={130} w={152} h={74} active={done}>
            <Label x={356} y={168} size={23}>
              {done ? "bo  |  FAIL" : "?"}
            </Label>
          </Card>
        </>
      );
    case 14:
      return (
        <>
          {[0, 1].map((i) => (
            <g key={i}>
              <Card x={75 + i * 175} y={48} w={155} h={140} active={step > 0}>
                <rect
                  x={88 + i * 175}
                  y={66}
                  width={129}
                  height={40}
                  rx={7}
                  fill={peach}
                />
                <Label x={152 + i * 175} y={87} size={21}>
                  {step ? "user" : i ? "user" : "username"}
                </Label>
                <Label x={152 + i * 175} y={147}>
                  {i ? "bo" : "ana"}
                </Label>
              </Card>
              {done && <Tick x={218 + i * 175} y={48} />}
            </g>
          ))}
          <Label x={240} y={218}>
            같은 뜻은 같은 이름으로
          </Label>
        </>
      );
    case 15:
      return (
        <>
          <Card x={43} y={44} w={126} h={145}>
            <Emoji x={106} y={92}>
              🏪
            </Emoji>
            <Label x={106} y={150}>
              연습 가게
            </Label>
          </Card>
          <Arrow x={181} y={114} w={36} />
          <Card x={232} y={34} w={200} h={155} active={done}>
            {["🍎", "🍌", "🍊"].map((v, i) => (
              <Emoji key={v} x={270 + i * 62} y={88} size={36}>
                {step > 0 && (i < 2 || done) ? v : "·"}
              </Emoji>
            ))}
            <Label x={332} y={150} size={22}>
              {done ? "잘 받음 3개" : "목록을 받아요"}
            </Label>
          </Card>
          {step > 0 && (
            <Label x={332} y={216} size={23} fill={coral}>
              ! 실패한 요청 1개
            </Label>
          )}
        </>
      );
    case 16:
      return (
        <>
          <circle
            cx={113}
            cy={113}
            r={65}
            fill={paper}
            stroke={ink}
            strokeWidth={3}
          />
          <path
            d="M113 68v45l-32,-18"
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Card x={224} y={43} w={200} h={126} active={step > 0}>
            <Emoji x={324} y={80} size={40}>
              {done ? "⌛" : "📨"}
            </Emoji>
            <Label x={324} y={132} size={25}>
              a · 12시 예약
            </Label>
          </Card>
          <Label x={113} y={206}>
            지금 10시
          </Label>
          <Label x={324} y={206} size={24}>
            {done ? "아직 기다려요" : step ? "10 < 12" : "언제 보낼까요?"}
          </Label>
        </>
      );
    case 17:
      return (
        <>
          <Emoji x={89} y={114} size={64}>
            🤖
          </Emoji>
          <Arrow x={140} y={115} w={35} />
          {["search", "delete"].map((v, i) => (
            <g key={v}>
              <Card
                x={193}
                y={39 + i * 89}
                w={175}
                h={72}
                active={step > 0 && i === 0}
              >
                <Label x={280} y={77 + i * 89}>
                  {v}
                </Label>
              </Card>
              {step > 0 && i === 0 && <Tick x={399} y={75} />}
              {done && i === 1 && (
                <Label x={399} y={166} size={36} fill={coral}>
                  ×
                </Label>
              )}
            </g>
          ))}
        </>
      );
    case 18:
      return (
        <>
          {["민지", "민지", "준호"].map((v, i) => (
            <Card
              key={i}
              x={42 + i * 132}
              y={38}
              w={116}
              h={93}
              active={step > 0}
            >
              <Emoji x={100 + i * 132} y={73} size={34}>
                {i < 2 ? "🐱" : "🐻"}
              </Emoji>
              <Label x={100 + i * 132} y={108} size={21}>
                {v}
              </Label>
            </Card>
          ))}
          <Label x={140} y={177}>
            {step ? "실패 3번" : "기록은 몇 장?"}
          </Label>
          <Label x={335} y={177}>
            {done ? "사람 2명" : "사람은 몇 명?"}
          </Label>
          {done && (
            <>
              <path
                d="M100 137v65h132V137"
                stroke={accent}
                strokeWidth={2}
                fill="none"
              />
              <Label x={240} y={223} size={21}>
                같은 사람이 두 번 나왔어요
              </Label>
            </>
          )}
        </>
      );
    default:
      return (
        <>
          {["📥", "🧺", "📊", "📄"].map((v, i) => (
            <g key={v}>
              <Card
                x={22 + i * 115}
                y={65}
                w={94}
                h={94}
                active={i <= step + 1}
              >
                <Emoji x={69 + i * 115} y={112} size={42}>
                  {v}
                </Emoji>
              </Card>
              {i < 3 && <Arrow x={119 + i * 115} y={112} w={14} />}
              <Label x={69 + i * 115} y={191} size={20}>
                {["모으기", "정리하기", "세기", "보고서"][i]}
              </Label>
              {done && i === 3 && <Tick x={451} y={66} />}
            </g>
          ))}
        </>
      );
  }
}
export function StoryScene({
  index,
  compact = false,
}: {
  index: number;
  compact?: boolean;
}) {
  const safeIndex = Number.isInteger(index)
    ? Math.max(0, Math.min(index, storyScenes.length - 1))
    : 0;
  return (
    <StorySceneSteps key={safeIndex} index={safeIndex} compact={compact} />
  );
}
function StorySceneSteps({
  index,
  compact,
}: {
  index: number;
  compact: boolean;
}) {
  const [step, setStep] = useState(0);
  const id = useId();
  const story = storyScenes[index];
  const shownStep = compact ? 2 : step;
  return (
    <figure className={`story-scene${compact ? " story-scene--compact" : ""}`}>
      {!compact && <figcaption>{story.title}</figcaption>}
      <svg
        className="story-scene__picture"
        viewBox="0 0 480 240"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{story.title}</title>
        <desc id={`${id}-description`}>{story.steps[shownStep]}</desc>
        <rect
          x={1}
          y={1}
          width={478}
          height={238}
          rx={24}
          fill="var(--surface-muted)"
        />
        <Scene index={index} step={shownStep} />
      </svg>
      {!compact && (
        <>
          <p
            className="story-scene__caption"
            aria-live="polite"
            aria-atomic="true"
          >
            {story.steps[step]}
          </p>
          <div className="story-scene__controls">
            <button
              type="button"
              onClick={() => setStep((value) => (value === 2 ? 0 : value + 1))}
            >
              {step === 2
                ? "처음부터 다시 보기"
                : step === 0
                  ? story.action
                  : "결과 보기"}
            </button>
            <span
              className="story-scene__count"
              role="img"
              aria-label={`그림 ${step + 1} / 3`}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={i === step ? "is-current" : ""}
                >
                  {i + 1}
                </span>
              ))}
            </span>
          </div>
        </>
      )}
    </figure>
  );
}
export default StoryScene;
