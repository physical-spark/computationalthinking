import type { CSSProperties } from "react";
import "./pass-celebration.css";

export type PassMoment = {
  id: string;
  stepId: string;
  code: string;
  output: string;
};

// A visual echo of the submitted code, never a fabricated execution trace.
export default function PassCelebration({ moment }: { moment: PassMoment }) {
  const snippet = moment.code.trim().slice(0, 160);
  const tokens =
    snippet.match(
      /"[^"\n]*"|'[^'\n]*'|\b\d+(?:\.\d+)?\b|\b\w+\b|\s+|[^\w\s]/gu,
    ) || [];
  const output = moment.output.trim().slice(0, 80);
  return (
    <div
      className="pass-celebration"
      aria-hidden="true"
      data-pass-id={moment.id}
    >
      <div className="pass-code">
        <span className="pass-caption">내가 쓴 코드</span>
        <code>
          {tokens.map((token, i) => (
            <span
              key={i}
              className={`pass-token ${/^\d/.test(token) ? "number" : /^["']/.test(token) ? "string" : ""}`}
              style={
                {
                  "--token-delay": `${Math.min(i, 18) * 25}ms`,
                } as CSSProperties
              }
            >
              {token}
            </span>
          ))}
        </code>
      </div>
      <div className="pass-connection">
        <span />
        <b>↓</b>
        <span />
      </div>
      <div className="pass-outcome">
        <span className="pass-check">✓</span>
        <div>
          <strong>내 코드가 해냈어요!</strong>
          {output && <code>{output}</code>}
        </div>
        <span className="pass-spark">✦</span>
      </div>
    </div>
  );
}
