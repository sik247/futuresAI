"use client";

/* Static SVG emblems — no per-emblem GSAP to keep things fast */

export function PaybackShieldEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 8L16 30V70C16 100 60 132 60 132C60 132 104 100 104 70V30L60 8Z" stroke="rgb(59,130,246)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 22L28 38V68C28 90 60 118 60 118C60 118 92 90 92 68V38L60 22Z" stroke="rgb(37,99,235)" strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
      <circle cx="60" cy="65" r="22" stroke="rgb(59,130,246)" strokeWidth="0.8" />
      <circle cx="60" cy="65" r="14" stroke="rgb(6,182,212)" strokeWidth="0.6" />
      <text x="60" y="70" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="monospace">%</text>
    </svg>
  );
}

export function ExchangeNetworkEmblem({ className }: { className?: string }) {
  const nodes = [
    { cx: 60, cy: 60, r: 10 },
    { cx: 20, cy: 30, r: 6 },
    { cx: 100, cy: 25, r: 6 },
    { cx: 105, cy: 75, r: 6 },
    { cx: 25, cy: 95, r: 6 },
    { cx: 75, cy: 110, r: 6 },
  ];
  const links = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[3,5],[4,5]];

  return (
    <svg className={className} viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      {links.map(([a, b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy} stroke="rgb(37,99,235)" strokeWidth="0.8" opacity="0.4" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={n.r} stroke={i === 0 ? "rgb(52,211,153)" : "rgb(59,130,246)"} strokeWidth={i === 0 ? 1.5 : 1} fill={i === 0 ? "rgba(52,211,153,0.15)" : "rgba(129,140,248,0.1)"} />
          {i === 0 && <circle cx={n.cx} cy={n.cy} r={3} fill="rgb(52,211,153)" opacity="0.8" />}
        </g>
      ))}
    </svg>
  );
}

export function CalculatorEmblem({ className }: { className?: string }) {
  const symbols = [
    ["1","+","0",".","7"],
    ["x","3","%","2","="],
    ["0","9","x","5","+"],
    [".","1","4","%","8"],
    ["6","=",".","3","0"],
  ];

  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="112" height="112" rx="8" stroke="rgb(6,182,212)" strokeWidth="0.8" opacity="0.3" />
      {symbols.map((row, ri) =>
        row.map((sym, ci) => {
          const x = 14 + ci * 22;
          const y = 14 + ri * 22;
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width="18" height="18" rx="3" stroke="rgb(59,130,246)" strokeWidth="0.5" fill="rgba(37,99,235,0.06)" />
              <text x={x + 9} y={y + 13} textAnchor="middle" fill="rgb(96,165,250)" fontSize="8" fontFamily="monospace" fontWeight="500">{sym}</text>
            </g>
          );
        })
      )}
    </svg>
  );
}

export function RocketEmblem({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 10L30 55H45V80H55V55H70L50 10Z" stroke="url(#rocketGrad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M50 22L38 50H46V70H54V50H62L50 22Z" stroke="rgb(59,130,246)" strokeWidth="0.8" strokeLinejoin="round" opacity="0.5" />
      <circle cx="50" cy="42" r="3" stroke="white" strokeWidth="0.8" fill="rgba(37,99,235,0.3)" />
      <line x1="42" y1="85" x2="42" y2="105" stroke="rgb(59,130,246)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="50" y1="82" x2="50" y2="110" stroke="rgb(6,182,212)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="58" y1="85" x2="58" y2="105" stroke="rgb(59,130,246)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <defs>
        <linearGradient id="rocketGrad" x1="50" y1="10" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="rgb(37,99,235)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
