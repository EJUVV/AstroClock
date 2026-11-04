import { sair } from '../compartilhado/api/auth.ts'

// EXEMPLO: dados fixos só para o protótipo. Na semana 3 vêm de percentualDaSemana(), abaixoDaMeta(), etc.
const INDICADORES = [
  { rotulo: 'Cumpriram a meta', valor: '78%', alerta: false },
  { rotulo: 'Abaixo da meta', valor: '14', alerta: false },
  { rotulo: 'Abaixo 2+ semanas seguidas', valor: '3', alerta: true },
  { rotulo: 'Cronômetros em revisão', valor: '2', alerta: false },
  { rotulo: 'Requerimentos pendentes', valor: '4', alerta: false },
]
const ABAIXO = [
  { id: 1, nome: 'Nome Sobrenome A', detalhe: 'Sede 2h/5h · Total 6h/10h', etiqueta: '3 semanas seguidas', grave: true },
  { id: 2, nome: 'Nome Sobrenome B', detalhe: 'Sede 5h/5h · Total 8h/10h', etiqueta: 'Falta total', grave: false },
  { id: 3, nome: 'Nome Sobrenome C', detalhe: 'Sede 1h/5h · Total 10h/10h', etiqueta: '2 semanas seguidas', grave: true },
  { id: 4, nome: 'Nome Sobrenome D', detalhe: 'Sede 0h/5h · Total 4h/10h', etiqueta: 'Ainda não cumpriu', grave: false },
]
const REQUERIMENTOS = [
  { id: 1, nome: 'Nome E', detalhe: 'Só remoto · 9 a 13 nov' },
  { id: 2, nome: 'Nome F', detalhe: 'Ausência total · 16 a 27 nov' },
]
const RANKING = ['Nome G · 42h', 'Nome H · 39h', 'Nome I · 37h']

const botao = 'min-h-12 rounded-xl border border-[#CBD2E1] bg-white px-4 font-semibold'

function PainelRH() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 bg-[#F6F7FB] p-7 text-[#0F1B33]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#5A6580]">Painel do RH</p>
          <h1 className="text-3xl font-bold">Semana de 2 a 8 nov</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className={botao}>
            + Cadastrar membro
          </button>
          <button type="button" onClick={() => void sair()} className={botao}>
            Sair
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {INDICADORES.map((i) => (
          <div
            key={i.rotulo}
            className={`rounded-2xl border bg-white p-4 ${i.alerta ? 'border-[#C0392B]' : 'border-[#E3E7F0]'}`}
          >
            <p className="text-xs text-[#5A6580]">{i.rotulo}</p>
            <p className={`text-4xl font-bold ${i.alerta ? 'text-[#A12A2A]' : ''}`}>{i.valor}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-[#E3E7F0] bg-white p-4 lg:col-span-2">
          <h2 className="mb-2 text-base font-semibold">Quem ficou abaixo da meta (dados de exemplo)</h2>
          {ABAIXO.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 border-t border-[#E3E7F0] py-2.5">
              <div>
                <b>{m.nome}</b>
                <p className="text-xs text-[#5A6580]">{m.detalhe}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.grave ? 'bg-[#FDE3E3] text-[#8E2323]' : 'bg-[#FFF1D6] text-[#7A4F00]'}`}
              >
                {m.etiqueta}
              </span>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-[#E3E7F0] bg-white p-4">
            <h2 className="mb-2 text-base font-semibold">Requerimentos</h2>
            {REQUERIMENTOS.map((r) => (
              <div key={r.id} className="border-t border-[#E3E7F0] py-2.5">
                <b>{r.nome}</b>
                <p className="mb-2 text-xs text-[#5A6580]">{r.detalhe}</p>
                <div className="flex gap-2">
                  <button type="button" className="min-h-11 flex-1 rounded-xl bg-[#0F1B33] font-semibold text-white">
                    Aprovar
                  </button>
                  <button type="button" className={`${botao} min-h-11 flex-1`}>
                    Reprovar
                  </button>
                </div>
              </div>
            ))}
          </section>
          <section className="rounded-2xl border border-[#E3E7F0] bg-white p-4">
            <h2 className="mb-2 text-base font-semibold">Ranking do mês</h2>
            {RANKING.map((r, i) => (
              <p key={r}>
                {i + 1}. {r}
              </p>
            ))}
          </section>
        </div>
      </div>
    </main>
  )
}

export default PainelRH