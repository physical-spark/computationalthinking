import { useId } from "react";

export default function NumberProblem({ square }: { square: boolean }) {
  const id = useId();
  return (
    <figure className="number-problem">
      <figcaption>
        {square ? "한 줄에 6개, 모두 6줄" : "17개를 5개씩 봉지에 담아요"}
      </figcaption>
      <svg viewBox="0 0 320 200" role="img" aria-labelledby={id}>
        <title id={id}>
          {square
            ? "가로 6개와 세로 6개로 놓인 정사각형 타일"
            : "다섯 개씩 담은 봉지 세 개와 봉지 밖에 남은 사탕 두 개"}
        </title>
        {square ? (
          Array.from({ length: 36 }, (_, i) => (
            <rect
              key={i}
              x={58 + (i % 6) * 30}
              y={10 + Math.floor(i / 6) * 28}
              width="24"
              height="22"
              rx="3"
              className="number-tile"
            />
          ))
        ) : (
          <>
            {[0, 1, 2].map((b) => (
              <g key={b}>
                <rect
                  x={12 + b * 96}
                  y="12"
                  width="86"
                  height="100"
                  rx="12"
                  className="number-bag"
                />
                {Array.from({ length: 5 }, (_, i) => (
                  <circle
                    key={i}
                    cx={35 + b * 96 + (i % 2) * 35}
                    cy={35 + Math.floor(i / 2) * 25}
                    r="9"
                    className="number-tile"
                  />
                ))}
                <text x={55 + b * 96} y="135" textAnchor="middle">
                  5개
                </text>
              </g>
            ))}
            <circle cx="140" cy="163" r="10" className="number-remainder" />
            <circle cx="175" cy="163" r="10" className="number-remainder" />
          </>
        )}
      </svg>
      <p>
        {square
          ? "한 줄의 타일 수 × 줄 수예요. 두 수가 같아서 제곱으로 쓸 수 있어요."
          : "꽉 찬 봉지 수는 몫(//), 봉지 밖에 남는 사탕 수는 나머지(%)예요."}
      </p>
    </figure>
  );
}
