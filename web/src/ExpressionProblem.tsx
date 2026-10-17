export default function ExpressionProblem() {
  return (
    <figure className="expression-problem">
      <figcaption>친구 네 명의 영화 나들이</figcaption>
      <svg
        viewBox="0 0 300 232"
        role="img"
        aria-labelledby="expression-receipt-title expression-receipt-desc"
      >
        <title id="expression-receipt-title">
          영화표, 팝콘, 할인 쿠폰을 계산해요
        </title>
        <desc id="expression-receipt-desc">
          영화표 네 장은 한 장에 8천 원, 함께 먹을 팝콘 한 세트는 1만 2천
          원이에요. 전체 금액에서 쿠폰 4천 원을 한 번 뺀 뒤 네 명이 똑같이 나눠
          내요.
        </desc>
        <rect
          x="1"
          y="1"
          width="298"
          height="230"
          rx="16"
          fill="var(--surface)"
          stroke="var(--border)"
        />
        <g
          fill="none"
          stroke="var(--text)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 23h28v8a5 5 0 0 0 0 10v8H22v-8a5 5 0 0 0 0-10Z" />
          <path d="M36 27v18" strokeDasharray="2 3" />
          <path d="m25 89 3 23h18l3-23Zm0 0c-5-9 4-14 9-9 4-10 15-5 14 2 8-3 12 5 4 10M34 94v14m7-14v14" />
          <path d="M23 148h28v22H23Zm6 6 16 10m-15 0 14-10" />
        </g>
        <g fill="var(--text)" fontFamily="inherit">
          <text x="70" y="29" fontSize="15" fontWeight="650">
            영화표 4장
          </text>
          <text x="70" y="49" fontSize="14">
            한 장에 8,000원
          </text>
          <text x="70" y="92" fontSize="15" fontWeight="650">
            함께 먹을 팝콘 1세트
          </text>
          <text x="70" y="112" fontSize="14">
            12,000원
          </text>
          <text x="70" y="155" fontSize="15" fontWeight="650">
            전체 금액 할인 쿠폰 1장
          </text>
          <text x="70" y="175" fontSize="14">
            전체에서 4,000원을 한 번 빼요
          </text>
        </g>
        <path d="M20 65h260M20 128h260" stroke="var(--border)" />
        <rect
          x="12"
          y="190"
          width="276"
          height="30"
          rx="8"
          fill="var(--accent-soft)"
        />
        <text
          x="150"
          y="210"
          textAnchor="middle"
          fill="var(--text)"
          fontFamily="inherit"
          fontSize="14"
          fontWeight="650"
        >
          4명이 나눠 내면, 한 사람당 얼마일까요?
        </text>
      </svg>
    </figure>
  );
}
