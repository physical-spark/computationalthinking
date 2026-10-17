import { useEffect, useId, useRef, useState } from "react";
import type { Concept } from "./concepts";
import "./code-walkthrough.css";

export type WalkthroughNode = { label: string; value: string };
export type WalkthroughFrame = {
  title: string;
  text: string;
  line: number | null;
  nodes: WalkthroughNode[];
  result: string;
};
export type Walkthrough = {
  term: string;
  intro: string;
  frames: WalkthroughFrame[];
};
type WalkthroughConcept = Concept & { walkthrough?: Walkthrough };

function SvgText({
  x,
  y,
  value,
  size = 22,
  maxWidth,
}: {
  x: number;
  y: number;
  value: string;
  size?: number;
  maxWidth?: number;
}) {
  const estimatedWidth = Array.from(value).reduce(
    (sum, character) =>
      sum + (/[\u0000-\u007f]/.test(character) ? 0.58 : 1) * size,
    0,
  );
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: size }}
      textLength={maxWidth && estimatedWidth > maxWidth ? maxWidth : undefined}
      lengthAdjust="spacingAndGlyphs"
    >
      {value}
    </text>
  );
}
function Apple({ x, y, size = 29 }: { x: number; y: number; size?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: size }}
    >
      🍎
    </text>
  );
}
function Arithmetic({ step, narrow }: { step: number; narrow: boolean }) {
  const width = narrow ? 320 : 480;
  if (step === 0) {
    const groupWidth = narrow ? 142 : 86;
    return (
      <>
        {[0, 1, 2, 3].map((group) => {
          const x = narrow ? 12 + (group % 2) * 154 : 12 + group * 94;
          const y = narrow ? 12 + Math.floor(group / 2) * 76 : 38;
          return (
            <g key={group}>
              <rect
                x={x}
                y={y}
                width={groupWidth}
                height={narrow ? 64 : 110}
                rx={12}
                className="code-walkthrough__group"
              />
              {[0, 1, 2].map((apple) => (
                <Apple
                  key={apple}
                  x={x + groupWidth / 2 + (apple - 1) * (narrow ? 36 : 25)}
                  y={y + (narrow ? 36 : 59)}
                  size={narrow ? 29 : 26}
                />
              ))}
            </g>
          );
        })}
        <rect
          x={narrow ? 83 : 396}
          y={narrow ? 167 : 38}
          width={narrow ? 154 : 72}
          height={narrow ? 46 : 110}
          rx={12}
          className="code-walkthrough__loose"
        />
        {[0, 1].map((apple) => (
          <Apple
            key={apple}
            x={narrow ? 140 + apple * 36 : 432}
            y={narrow ? 191 : 75 + apple * 37}
            size={29}
          />
        ))}
        {!narrow && <SvgText x={240} y={183} value="2 + 3 × 4" size={27} />}
      </>
    );
  }
  if (step === 1) {
    const groupWidth = narrow ? 195 : 300;
    return (
      <>
        <rect
          x={12}
          y={16}
          width={groupWidth}
          height={154}
          rx={14}
          className="code-walkthrough__group"
        />
        {Array.from({ length: 12 }, (_, apple) => (
          <Apple
            key={apple}
            x={narrow ? 42 + (apple % 4) * 44 : 66 + (apple % 4) * 66}
            y={44 + Math.floor(apple / 4) * 43}
            size={narrow ? 28 : 32}
          />
        ))}
        <rect
          x={narrow ? 228 : 344}
          y={16}
          width={narrow ? 80 : 124}
          height={154}
          rx={14}
          className="code-walkthrough__loose"
        />
        {[0, 1].map((apple) => (
          <Apple
            key={apple}
            x={narrow ? 268 : 406}
            y={69 + apple * 49}
            size={32}
          />
        ))}
        <SvgText
          x={width / 2}
          y={narrow ? 203 : 192}
          value="3 × 4 = 12 → 2 + 12"
          size={narrow ? 23 : 26}
        />
      </>
    );
  }
  return (
    <>
      <rect
        x={12}
        y={18}
        width={width - 24}
        height={139}
        rx={14}
        className="code-walkthrough__group"
      />
      {Array.from({ length: 14 }, (_, apple) => (
        <Apple
          key={apple}
          x={narrow ? 33 + (apple % 7) * 42 : 48 + (apple % 7) * 64}
          y={64 + Math.floor(apple / 7) * 50}
          size={narrow ? 28 : 34}
        />
      ))}
      <SvgText
        x={width / 2}
        y={narrow ? 201 : 190}
        value="2 + 12 = 14"
        size={30}
      />
    </>
  );
}
function ValueFlow({
  frame,
  narrow,
}: {
  frame: WalkthroughFrame;
  narrow: boolean;
}) {
  const nodes = frame.nodes.slice(0, 6);
  const columns = Math.min(narrow ? 2 : 3, Math.max(1, nodes.length));
  const width = narrow ? 320 : 480;
  const gap = 14;
  const cardWidth = (width - 24 - gap * (columns - 1)) / columns;
  return (
    <>
      {nodes.map((node, i) => {
        const row = Math.floor(i / columns);
        const column = i % columns;
        const x = 12 + column * (cardWidth + gap);
        const y = 10 + row * 74;
        return (
          <g key={`${i}-${node.label}`}>
            <rect
              x={x}
              y={y}
              width={cardWidth}
              height={64}
              rx={11}
              className="code-walkthrough__value-card"
            />
            <SvgText
              x={x + cardWidth / 2}
              y={y + 18}
              value={node.label}
              size={17}
              maxWidth={cardWidth - 18}
            />
            <SvgText
              x={x + cardWidth / 2}
              y={y + 45}
              value={node.value}
              size={22}
              maxWidth={cardWidth - 18}
            />
          </g>
        );
      })}
    </>
  );
}

export default function CodeWalkthrough(props: {
  concept: WalkthroughConcept;
  index: number;
  compact?: boolean;
  showCode?: boolean;
}) {
  // A different concept starts from the first frame, even within the same page renderer.
  return (
    <WalkthroughSteps key={`${props.index}:${props.concept.code}`} {...props} />
  );
}
function WalkthroughSteps({
  concept,
  index,
  compact = false,
  showCode = false,
}: {
  concept: WalkthroughConcept;
  index: number;
  compact?: boolean;
  showCode?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [narrow, setNarrow] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(max-width:520px)").matches,
  );
  const host = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const update = () => setNarrow(element.getBoundingClientRect().width < 420);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const walkthrough = concept.walkthrough;
  if (!walkthrough?.frames.length)
    return (
      <figure ref={host} className="code-walkthrough">
        <pre className="code-walkthrough__code">
          <code>{concept.code}</code>
        </pre>
      </figure>
    );
  const frames = walkthrough.frames.slice(0, 4);
  const currentStep = compact ? 0 : Math.min(step, frames.length - 1);
  const frame = frames[currentStep];
  const rows = Math.ceil(Math.min(frame.nodes.length, 6) / (narrow ? 2 : 3));
  const width = narrow ? 320 : 480;
  const height =
    index === 0 ? (narrow ? 230 : 210) : Math.max(96, rows * 74 + 10);
  const description =
    index === 0
      ? `${frame.text} ${frame.result}`
      : `${frame.text} ${frame.nodes.map((node) => `${node.label}: ${node.value}`).join("。 ")}。 ${frame.result}`;
  return (
    <figure
      ref={host}
      className={`code-walkthrough${compact ? " code-walkthrough--compact" : ""}`}
    >
      {!compact && (
        <figcaption>
          {walkthrough.term} · {frame.title}
        </figcaption>
      )}
      <svg
        className="code-walkthrough__picture"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
      >
        <title id={`${id}-title`}>{frame.title}</title>
        <desc id={`${id}-description`}>{description}</desc>
        {index === 0 ? (
          <Arithmetic step={currentStep} narrow={narrow} />
        ) : (
          <ValueFlow frame={frame} narrow={narrow} />
        )}
      </svg>
      {!compact && (
        <>
          <div
            className="code-walkthrough__narration"
            aria-live="polite"
            aria-atomic="true"
          >
            <p>{frame.text}</p>
            {frame.result && (
              <p className="code-walkthrough__result">{frame.result}</p>
            )}
          </div>
          {showCode && (
            <pre className="code-walkthrough__code" aria-label="파이썬 코드">
              <code>
                {concept.code.split("\n").map((line, i) => (
                  <span
                    key={i}
                    className={
                      frame.line === i + 1 ? "is-current-line" : undefined
                    }
                    aria-current={frame.line === i + 1 ? "step" : undefined}
                  >
                    <span
                      className="code-walkthrough__line-number"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    {line || " "}
                    {"\n"}
                  </span>
                ))}
              </code>
            </pre>
          )}
          <div
            className="code-walkthrough__controls"
            aria-label="코드 풀이 단계"
          >
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              이전 장면
            </button>
            <span className="code-walkthrough__position">
              {currentStep + 1} / {frames.length}
            </span>
            <button
              type="button"
              className="primary"
              onClick={() =>
                setStep((value) =>
                  value === frames.length - 1 ? 0 : value + 1,
                )
              }
            >
              {currentStep === frames.length - 1
                ? "처음부터 보기"
                : "다음 장면"}
            </button>
          </div>
        </>
      )}
    </figure>
  );
}
