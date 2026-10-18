export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-12">
      <header className="flex items-center justify-between border-b border-green-950/10 pb-6">
        <span className="text-lg font-black tracking-tight">fixtures<span className="text-green-700"
        <span className="rounded-full border border-green-950/10 px-3 py-1 text-xs text-green-950/60">Futebol → Calendário</span>
      </header>
      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="mb-6 text-xs font-bold tracking-[0.2em] text-green-700 uppercase">Só os jogos que importam</p>
        <h1 className="max-w-3xl text-5xl leading-[1.06] font-bold tracking-tight sm:text-7xl">Seu futebol.<br /><span className="text-green-700">No seu calendário.</span></h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-green-950/60">Seu time, os grandes confrontos ou aquela partida imperdível. Escolha o que acompanhar e leve para o seu calendário.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            ["01", "Escolha a competição", "O ponto de partida para encontrar seus jogos."],
            ["02", "Filtre do seu jeito", "Seu time, adversários ou partidas específicas."],
            ["03", "Leve para o calendário", "Baixe um arquivo .ics e importe no seu app favorito."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-green-950/10 bg-white p-6">
              <span className="text-sm font-bold text-green-700">{number}</span>
              <h2 className="mt-5 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-green-950/60">{description}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-green-950/50">Em construção · Seleção de competições e integração de jogos em breve.</p>
      </section>
      <footer className="border-t border-green-950/10 pt-5 text-xs text-green-950/50">Menos ruído. Mais futebol.</footer>
    </main>
  );
}
