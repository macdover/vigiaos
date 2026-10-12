import React, { useState } from 'react';
import { 
  Megaphone, 
  Download, 
  Copy, 
  Check, 
  Video, 
  Image as ImageIcon, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  Users, 
  FileText, 
  ExternalLink,
  MessageSquare,
  Eye,
  Camera,
  Layers,
  Award
} from 'lucide-react';

import posterIniciante from '../assets/images/poster_iniciante_cftv_1789529936363.jpg';
import posterCampo from '../assets/images/poster_campo_tecnico_1789529949428.jpg';
import posterEscala from '../assets/images/poster_escala_clientes_1789529961640.jpg';
import posterStories from '../assets/images/poster_stories_cftv_1789529975745.jpg';

interface MarketingKitViewProps {
  onBack?: () => void;
}

export const MarketingKitView: React.FC<MarketingKitViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'posters' | 'videos' | 'copies'>('posters');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; desc: string } | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const postersData = [
    {
      id: 'iniciante',
      title: 'Para Iniciantes em CFTV & Segurança',
      targetAudience: 'Iniciantes e Instaladores Autônomos',
      aspectRatio: '1:1 (Feed Instagram & WhatsApp)',
      description: 'Ideal para quem está saindo do bloco de notas de papel e WhatsApp bagunçado para ter uma imagem 100% profissional.',
      headline: 'Chega de perder dinheiro com ordens de serviço no papel!',
      keyPoints: [
        'Orçamentos rápidos com PDF direto no WhatsApp',
        'Ordens de Serviço no celular sem complicação',
        'Visual profissional que passa confiança ao cliente'
      ],
      imgSrc: posterIniciante,
      fileName: 'poster-vigiaos-cftv-iniciante.jpg',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      id: 'campo_medio',
      title: 'Para Empresas Medianas com Técnicos',
      targetAudience: 'Empresas em Crescimento (2 a 10 Técnicos)',
      aspectRatio: '1:1 (Feed Instagram & WhatsApp)',
      description: 'Focado no controle da equipe externa de instaladores e manutenção com relatórios fotográficos e assinatura.',
      headline: 'Sua equipe de campo sincronizada em tempo real!',
      keyPoints: [
        'Relatório fotográfico com fotos de antes e depois',
        'Assinatura digital do cliente na tela do celular',
        'Controle de status em deslocamento, em andamento e concluído'
      ],
      imgSrc: posterCampo,
      fileName: 'poster-vigiaos-gestao-campo-tecnicos.jpg',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'escala_500',
      title: 'Para Grandes Empresas (+500 Clientes)',
      targetAudience: 'Grandes Integradores & Operações Robustas',
      aspectRatio: '1:1 (Feed Instagram & WhatsApp)',
      description: 'Para quem gerencia centenas de contratos, portarias virtuais, condomínios e precisa de controle total.',
      headline: 'Potência e estabilidade para operações de grande porte!',
      keyPoints: [
        'Suporte a mais de 500 clientes e contratos recorrentes',
        'Gestão de múltiplos técnicos e frotas externas',
        'Histórico vitalício de manutenções por cliente e equipamento'
      ],
      imgSrc: posterEscala,
      fileName: 'poster-vigiaos-grandes-empresas-cftv.jpg',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'stories_vertical',
      title: 'Pôster Vertical (Stories & Status)',
      targetAudience: 'Status WhatsApp, Instagram Stories e TikTok',
      aspectRatio: '9:16 (Vertical Mobile)',
      description: 'Design vertical impactante com aplicativo móvel aberto na mão do instalador e câmeras de segurança.',
      headline: 'O sistema definitivo para instaladores de segurança eletrônica!',
      keyPoints: [
        'Otimizado para a tela cheia de smartphones',
        'Gera cliques rápidos e curiosidade imediata',
        'Ideal para postar no status do WhatsApp para seus contatos'
      ],
      imgSrc: posterStories,
      fileName: 'poster-vigiaos-stories-whatsapp.jpg',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }
  ];

  const videoScripts = [
    {
      id: 'video-iniciante',
      title: 'Vídeo 1: "O Fim da Prancheta de Papel" (30 segundos)',
      audience: 'Para quem está começando e quer parecer profissional',
      objective: 'Chamar a atenção de quem ainda usa papel ou bloco de notas',
      format: 'Reels / Shorts / TikTok (Gravado com celular ou locução)',
      scenes: [
        {
          time: '0s - 5s',
          visual: 'Corte rápido mostrando uma prancheta amassada ou caderno com anotações de clientes rasuradas.',
          speech: 'Você ainda gasta tempo preenchendo ordem de serviço em bloquinho de papel ou mandando mensagem solta no WhatsApp?'
        },
        {
          time: '5s - 15s',
          visual: 'Mostra o VigiaOS aberto no smartphone com orçamento gerado e botão "PDF no WhatsApp".',
          speech: 'Com o VigiaOS, você monta a proposta em 2 minutos e o cliente recebe o PDF completo direto no WhatsApp dele com a sua marca!'
        },
        {
          time: '15s - 25s',
          visual: 'Mostra tela de assinatura do cliente na tela do celular e fotos anexadas.',
          speech: 'Técnico de campo com fotos do serviço, assinatura digital na hora e controle do que foi instalado. O cliente valoriza e fecha na hora!'
        },
        {
          time: '25s - 30s',
          visual: 'Logo VigiaOS com link para teste gratuito.',
          speech: 'Profissionalize seu negócio de CFTV agora mesmo. Acesse VigiaOS e teste hoje!'
        }
      ]
    },
    {
      id: 'video-mediano',
      title: 'Vídeo 2: "Como Controlar seus Técnicos na Rua" (45 segundos)',
      audience: 'Para empresas medianas com 2 a 10 técnicos de campo',
      objective: 'Mostrar o controle em tempo real e fim das dores de cabeça com equipe',
      format: 'Reels / Vídeo do WhatsApp para Donos de Empresa',
      scenes: [
        {
          time: '0s - 8s',
          visual: 'Dono da empresa no escritório atendendo ligação estressante: "Técnico sumiu? Onde ele está?"',
          speech: 'Você já passou pelo pesadelo de não saber em qual cliente o seu técnico está ou qual serviço ele realmente executou?'
        },
        {
          time: '8s - 20s',
          visual: 'Painel do VigiaOS com status: "Em deslocamento", "Em andamento" e "Concluído" com técnico vinculado.',
          speech: 'No VigiaOS, cada técnico tem login próprio no celular. Ele vê os chamados do dia, avisa quando chega e tira foto do antes e depois.'
        },
        {
          time: '20s - 35s',
          visual: 'Cliente assinando na tela do celular e o relatório sendo enviado em PDF com garantia.',
          speech: 'Quando o serviço termina, o cliente assina na tela do smartphone e o relatório sai formatado com os termos de garantia da sua empresa.'
        },
        {
          time: '35s - 45s',
          visual: 'Tela de faturamento e ordens concluídas.',
          speech: 'Mais agilidade, zero retrabalho e mais faturamento. Conheça o VigiaOS!'
        }
      ]
    },
    {
      id: 'video-escala',
      title: 'Vídeo 3: "Gestão para Mais de 500 Clientes de CFTV" (60 segundos)',
      audience: 'Grandes Integradores, Provedores e Empresas de Portaria Virtual',
      objective: 'Apresentar robustez, contratos recorrentes e histórico completo',
      format: 'Vídeo Institucional / Apresentação Comercial para Diretores',
      scenes: [
        {
          time: '0s - 10s',
          visual: 'Imagens de centrais de monitoramento, condomínios com câmeras speed dome e controle de acesso.',
          speech: 'Gerenciar 100, 300 ou mais de 500 clientes de segurança eletrônica exige um sistema projetado para a sua realidade.'
        },
        {
          time: '10s - 25s',
          visual: 'Gráficos do VigiaOS com clientes ativos, histórico de manutenção preventiva e contratos.',
          speech: 'O VigiaOS foi construído exclusivamente para integradores de CFTV, alarmes, controle de acesso e interfonia. Não é um ERP genérico de padaria.'
        },
        {
          time: '25s - 45s',
          visual: 'Filtro por cliente mostrando todas as OSs desde 2024, equipamentos instalados e laudos.',
          speech: 'Tenha o histórico vitalício de cada cliente: qual câmera foi instalada, data de garantia, laudo do técnico com fotos e aprovação digital imediata.'
        },
        {
          time: '45s - 60s',
          visual: 'Encerramento com selo de segurança e facilidade em nuvem.',
          speech: 'Escale sua empresa com segurança e tecnologia. Faça o teste corporativo do VigiaOS!'
        }
      ]
    }
  ];

  const copiesData = [
    {
      id: 'copy-whatsapp-grupos',
      title: 'Mensagem para Grupos de WhatsApp de Instaladores e CFTV',
      tag: 'WhatsApp Grupos',
      text: `🚀 *CHEGA DE PERDER CLIENTE POR FALTA DE ORGANIZAÇÃO!*

Você ainda usa papel ou mensagem solta de WhatsApp pra passar orçamento de câmera e alarme?

Conheça o *VigiaOS* — O Sistema feito EXCLUSIVAMENTE para Instaladores e Empresas de Segurança Eletrônica & CFTV!

✅ Monta Orçamento Profissional em 2 minutos
✅ Envia o PDF completo direto no WhatsApp do cliente
✅ Ordem de Serviço no celular com fotos de Antes e Depois
✅ Assinatura digital do cliente na tela do celular
✅ Login individual para seus técnicos de campo
✅ Controle de clientes, manutenções e garantias

📲 Acesse e teste agora na prática:
https://vigiaos.com.br

Mude a imagem da sua empresa e feche mais serviços hoje mesmo!`
    },
    {
      id: 'copy-direta-dono',
      title: 'Abordagem Direta (1 a 1) para Donos de Empresas de CFTV',
      tag: 'Prospecção Ativa',
      text: `Olá [Nome], tudo bem?

Acompanho o trabalho da sua empresa de segurança e CFTV e notei o padrão dos seus serviços!

Você já usa algum sistema específico para gerenciar as ordens de serviço da sua equipe de campo e enviar os orçamentos em PDF com fotos direto no WhatsApp do cliente?

Nós desenvolvemos o *VigiaOS*, uma plataforma feita sob medida para integradores de CFTV e segurança (sem aquela complicação de sistemas genéricos).

Os técnicos adoram porque é muito simples no celular, e os donos conseguem ver tudo o que foi feito na hora, com foto de antes/depois e assinatura do cliente.

Posso te mandar um link para você dar uma olhada sem compromisso? Tenho certeza que vai economizar horas da sua semana.`
    },
    {
      id: 'copy-instagram-feed',
      title: 'Legenda Pronta para Instagram / Facebook (Com as Artes)',
      tag: 'Redes Sociais',
      text: `Você sabia que 70% dos clientes de segurança eletrônica fecham com quem envia uma proposta profissional primeiro? 📹⚡

Se você ainda anota chamado no caderno ou manda preço por áudio no WhatsApp, sua empresa está deixando dinheiro na mesa!

Com o @VigiaOS, você:
🎯 Envia proposta em PDF no WhatsApp do cliente em segundos
📸 Registra fotos de ANTES e DEPOIS da instalação
✍️ Coleta assinatura do cliente na tela do celular
👷‍♂️ Dá acesso aos seus técnicos de campo sem bagunça
📊 Controla faturamento e manutenções preventivas

Seja você um instalador autônomo ou uma empresa com centenas de clientes, o VigiaOS é a chave para o seu próximo nível.

👉 Toque no link da bio e faça seu teste agora mesmo!

#cftv #segurancaeletronica #instaladordecftv #alarmes #controledeacesso #cameradeseguranca #vigiaos`
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-3">
              <Megaphone className="w-3.5 h-3.5" />
              Kit Oficial de Divulgação & Marketing VigiaOS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pôsteres, Artes & Roteiros de Vídeo
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Materiais prontos de alta conversão para você divulgar o <strong>VigiaOS</strong> para instaladores iniciantes, empresas medianas com equipes de campo e grandes integradores de segurança com mais de 500 clientes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('posters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'posters'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Pôsteres & Artes Prontas ({postersData.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Roteiros para Vídeos & Reels ({videoScripts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'copies'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Textos Prontos para WhatsApp & Redes ({copiesData.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PÔSTERES */}
      {activeTab === 'posters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {postersData.map((poster) => (
            <div 
              key={poster.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col"
            >
              {/* Header Info */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${poster.badgeColor}`}>
                    {poster.targetAudience}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{poster.title}</h3>
                </div>
                <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                  {poster.aspectRatio}
                </span>
              </div>

              {/* Image Preview Area */}
              <div className="relative group bg-slate-950 flex items-center justify-center overflow-hidden max-h-[380px]">
                <img
                  src={poster.imgSrc}
                  alt={poster.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[380px] transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs p-4">
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ src: poster.imgSrc, title: poster.title, desc: poster.description })}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Ampliar
                  </button>
                  <a
                    href={poster.imgSrc}
                    download={poster.fileName}
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arte HD
                  </a>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                    {poster.headline}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {poster.description}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {poster.keyPoints.map((point, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Pronto para Instagram Feed, WhatsApp Status & Grupos
                  </span>
                  <a
                    href={poster.imgSrc}
                    download={poster.fileName}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar Imagem
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ROTEIROS DE VÍDEO */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Como Usar os Roteiros de Vídeo:</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Você pode gravar esses vídeos você mesmo com o celular na mão mostrando a tela do sistema, ou pode usar aplicativos de inteligência artificial (como D-ID, HeyGen, CapCut) com locução automática para criar anúncios profissionais para o Instagram e TikTok!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {videoScripts.map((v) => (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                      {v.format}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{v.title}</h3>
                    <p className="text-xs text-slate-400">Público-Alvo: {v.audience}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const fullScript = `${v.title}\n\nPúblico: ${v.audience}\n\n` + 
                        v.scenes.map(s => `[${s.time}]\nVisual: ${s.visual}\nFala/Áudio: "${s.speech}"`).join('\n\n');
                      handleCopy(v.id, fullScript);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                  >
                    {copiedId === v.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === v.id ? 'Roteiro Copiado!' : 'Copiar Roteiro Completo'}
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Estrutura Cena por Cena:
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {v.scenes.map((scene, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row gap-3">
                        <div className="sm:w-28 shrink-0">
                          <span className="inline-block px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-cyan-400">
                            {scene.time}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="text-xs text-slate-400">
                            <strong className="text-slate-300">Câmera / Visual:</strong> {scene.visual}
                          </div>
                          <div className="text-xs text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                            <strong className="text-emerald-400">Fala / Narração:</strong> "{scene.speech}"
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEXTOS PRONTOS (COPIES) */}
      {activeTab === 'copies' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {copiesData.map((c) => (
              <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                      {c.tag}
                    </span>
                    <h3 className="text-base font-bold text-white">{c.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.id, c.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === c.id ? 'Copiado com Sucesso!' : 'Copiar Texto'}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                    {c.text}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white text-base">{previewImage.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center bg-slate-950 rounded-xl p-2 max-h-[70vh] overflow-hidden">
              <img
                src={previewImage.src}
                alt={previewImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[68vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-300">{previewImage.desc}</p>
              <a
                href={previewImage.src}
                download="vigiaos-poster.jpg"
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                Baixar Alta Resolução
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
