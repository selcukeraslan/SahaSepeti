/** Geçici sayfa — ilgili faz tamamlanınca kaldırılacak. */
export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <p className="text-lg font-medium text-slate-400">{title} — yakında</p>
    </div>
  )
}
