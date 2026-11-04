import { useEffect, useState, type ReactNode } from 'react'
import { meuNome, sair } from '../compartilhado/api/auth.ts'

// EXEMPLO: dados fixos só para o protótipo. Na semana 3 vêm de progressoDaSemana(), etc.
const SEMANA = { rotulo: '2 a 8 nov', horasSede: 3, metaSede: 5, horasTotal: 7, metaTotal: 10 }
const TEMPO = [
  { nome: 'Dia', pct: 58 },
  { nome: 'Semana', pct: 36 },
  { nome: 'Mês', pct: 10 },
  { nome: 'Ano', pct: 84 },
]
const HORAS_DIA = [
  { dia: 'S', h: 4 },
  { dia: 'T', h: 3 },
  { dia: 'Q', h: 0 },
  { dia: 'Q', h: 0 },
  { dia: 'S', h: 0 },
  { dia: 'S', h: 0 },
  { dia: 'D', h: 0 },
]
const REGISTROS = [
  { id: 1, quando: 'Sede, 09:00 às 12:00', texto: 'Revisão do projeto' },
  { id: 2, quando: 'Online, 14:00 às 18:00', texto: 'Estudo e documentação' },
]
const SEMANAS = [
  { id: 1, rotulo: '2 a 8 nov', estado: 'andamento' },
  { id: 2, rotulo: '9 a 15 nov', estado: 'futura' },
  { id: 3, rotulo: '16 a 22 nov', estado: 'futura' },
  { id: 4, rotulo: '23 a 29 nov', estado: 'futura' },
  { id: 5, rotulo: '30 nov a 6 dez', estado: 'futura' },
]
const HISTORICO = [
  { id: 1, rotulo: '26 out a 1 nov', detalhe: 'Sede 6h · Total 11h', estado: 'cumpriu' },
  { id: 2, rotulo: '19 a 25 out', detalhe: 'Sede 2h · Total 8h', estado: 'abaixo' },
  { id: 3, rotulo: '12 a 18 out', detalhe: 'Ausência total aprovada', estado: 'dispensada' },
  { id: 4, rotulo: '5 a 11 out', detalhe: 'Sede 5h · Total 10h', estado: 'cumpriu' },
] as const

const ETIQUETA: Record<string, { texto: string; classe: string }> = {
  andamento: { texto: 'Em andamento', classe: 'bg-[#FFF1D6] text-[#7A4F00]' },
  futura: { texto: 'Futura', classe: 'bg-[#E6EAF3] text-[#3B4660]' },
  cumpriu: { texto: 'Cumpriu', classe: 'bg-[#DDF3E8] text-[#14573D]' },
  abaixo: { texto: 'Abaixo da meta', classe: 'bg-[#FDE3E3] text-[#8E2323]' },
  dispensada: { texto: 'Dispensada', classe: 'bg-[#E6EAF3] text-[#3B4660]' },
}

function Etiqueta({ tipo }: { tipo: string }) {
  const e = ETIQUETA[tipo]
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.classe}`}>{e.texto}</span>
}

function Barra({ rotulo, valor, meta }: { rotulo: string; valor: number; meta: number }) {
  const pct = meta === 0 ? 100 : Math.min(100, Math.round((valor / meta) * 100))
  return (
    <div>
      <div className="mb-1.5 flex justify-between">
        <b>{rotulo}</b>
        <span>
          {valor}h / {meta}h
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-md bg-[#E6EAF3]">
        <div className="h-full rounded-md bg-[#E0951A]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#E3E7F0] bg-white p-4">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

const botao = 'min-h-12 rounded-xl border border-[#CBD2E1] bg-white px-4 font-semibold'

function PainelMembro() {
  const [nome, setNome] = useState('')
  const [local, setLocal] = useState<'sede' | 'online'>('sede')
  const [ativo, setAtivo] = useState(false)
  const [naSede, setNaSede] = useState(false)

  useEffect(() => {
    meuNome()
      .then(setNome)
      .catch(() => setNome(''))
  }, [])

  const cumpriu = SEMANA.horasSede >= SEMANA.metaSede && SEMANA.horasTotal >= SEMANA.metaTotal

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-3.5 bg-[#F6F7FB] p-5 text-[#0F1B33]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#5A6580]">Bem-vindo</p>
          <h1 className="text-2xl font-bold">Olá, {nome || 'membro'}</h1>
        </div>
        <button type="button" onClick={() => void sair()} className={`${botao} min-h-11`}>
          Sair
        </button>
      </header>

      <Cartao titulo={`Semana de ${SEMANA.rotulo}`}>
        <span
          className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${cumpriu ? ETIQUETA.cumpriu.classe : ETIQUETA.andamento.classe}`}
        >
          {cumpriu ? 'Meta cumprida' : 'Ainda não cumpriu'}
        </span>
        <Barra rotulo="Horas na sede" valor={SEMANA.horasSede} meta={SEMANA.metaSede} />
        <Barra rotulo="Horas totais" valor={SEMANA.horasTotal} meta={SEMANA.metaTotal} />
        <p className="text-xs text-[#5A6580]">Horas online não compensam as da sede.</p>
      </Cartao>

      <Cartao titulo="Cronômetro">
        <p className="text-center text-4xl font-bold tabular-nums">00:00:00</p>
        <div className="flex gap-2">
          {(['sede', 'online'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={local === l}
              onClick={() => setLocal(l)}
              className={`${botao} flex-1 capitalize ${local === l ? 'border-[#0F1B33] bg-[#0F1B33] text-white' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          aria-label="Descrição"
          placeholder="O que você vai fazer?"
          className="min-h-12 rounded-xl border border-[#CBD2E1] px-3"
        />
        <button
          type="button"
          onClick={() => setAtivo(!ativo)}
          className={`min-h-12 rounded-xl font-semibold text-white ${ativo ? 'bg-[#A12A2A]' : 'bg-[#1F7A55]'}`}
        >
          {ativo ? 'Parar' : 'Iniciar'}
        </button>
        <p className="text-xs text-[#5A6580]">Não registre reuniões e eventos.</p>
      </Cartao>

      <div className="flex gap-2">
        <button type="button" className={`${botao} flex-1`}>
          + Registrar horas
        </button>
        <button
          type="button"
          aria-pressed={naSede}
          onClick={() => setNaSede(!naSede)}
          className={`${botao} flex-1 ${naSede ? 'border-[#1F7A55] bg-[#DDF3E8]' : ''}`}
        >
          {naSede ? 'Saí da sede' : 'Estou na sede'}
        </button>
      </div>
      <p className="text-xs text-[#5A6580]">Na sede agora: Ana, Bruno, Carla (exemplo)</p>

      <Cartao titulo="Tempo que já passou">
        {TEMPO.map((t) => (
          <div key={t.nome} className="flex items-center gap-2">
            <span className="w-16">{t.nome}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-md bg-[#E6EAF3]">
              <div className="h-full rounded-md bg-[#5B7BD5]" style={{ width: `${t.pct}%` }} />
            </div>
            <span className="w-9 text-right text-xs text-[#5A6580]">{t.pct}%</span>
          </div>
        ))}
      </Cartao>

      <Cartao titulo="Horas por dia">
        <div className="flex h-24 items-end gap-2">
          {HORAS_DIA.map((d, i) => (
            <div
              key={i}
              title={`${d.h}h`}
              className={`flex-1 rounded-t-md ${d.h ? 'bg-[#0F1B33]' : 'bg-[#CBD2E1]'}`}
              style={{ height: `${Math.max(4, d.h * 20)}%` }}
            />
          ))}
        </div>
        <div className="flex gap-2 text-xs text-[#5A6580]">
          {HORAS_DIA.map((d, i) => (
            <span key={i} className="flex-1 text-center">
              {d.dia}
            </span>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="Registros da semana">
        {REGISTROS.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2">
            <div>
              <b>{r.quando}</b>
              <p className="text-xs text-[#5A6580]">{r.texto}</p>
            </div>
            <button type="button" className={`${botao} min-h-11`}>
              Editar
            </button>
          </div>
        ))}
      </Cartao>

      <Cartao titulo="Resumo de novembro (exemplo)">
        <div className="flex gap-2.5">
          {[
            ['7h', 'Total no mês'],
            ['3h', 'Na sede'],
            ['0 de 1', 'Semanas cumpridas'],
          ].map(([v, l]) => (
            <div key={l} className="flex-1">
              <p className="text-2xl font-bold">{v}</p>
              <p className="text-xs text-[#5A6580]">{l}</p>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="Ranking de novembro">
        <p>12º de 40 na EJ</p>
        <p>3º de 6 no seu setor</p>
        <p className="text-xs text-[#5A6580]">Você vê só a sua posição.</p>
      </Cartao>

      <Cartao titulo="Semanas de novembro">
        {SEMANAS.map((s) => (
          <div
            key={s.id}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${s.estado === 'andamento' ? 'border-2 border-[#E0951A]' : 'border border-[#E3E7F0]'}`}
          >
            <b>{s.rotulo}</b>
            <Etiqueta tipo={s.estado} />
          </div>
        ))}
      </Cartao>

      <Cartao titulo="Histórico (exemplo)">
        {HISTORICO.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-2 border-t border-[#E3E7F0] pt-2.5">
            <div>
              <b>{h.rotulo}</b>
              <p className="text-xs text-[#5A6580]">{h.detalhe}</p>
            </div>
            <Etiqueta tipo={h.estado} />
          </div>
        ))}
      </Cartao>

      <button type="button" className={botao}>
        Pedir ausência (requerimento)
      </button>
    </main>
  )
}

export default PainelMembro