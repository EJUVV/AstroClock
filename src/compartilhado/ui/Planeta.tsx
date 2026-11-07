export default function Planeta({ tamanho, className = '' }: { tamanho: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative shrink-0 ${className}`}
      style={{ width: tamanho, height: tamanho }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 28%, #f3e8ff, #8b5cf6 38%, #2e1065 78%, #0b0420)',
          boxShadow: '0 0 40px rgba(168,85,247,0.55)',
        }}
      />
      <div
        className="absolute rounded-[50%] border-2 border-[#d8b4fe]/60"
        style={{ left: '-45%', right: '-45%', top: '38%', height: '26%', transform: 'rotate(-16deg)' }}
      />
    </div>
  )
}
