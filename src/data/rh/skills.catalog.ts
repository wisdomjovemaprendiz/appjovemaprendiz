export type SkillGroup = {
  area: string;
  funcoes: string[];
  perfil: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    area: "Administrativo",
    funcoes: [
      "Organização de documentos",
      "Atendimento telefônico",
      "Lançamento de informações em planilhas",
      "Controle de arquivos",
      "Apoio em rotinas administrativas",
      "Digitalização de documentos",
      "Conferência de dados",
      "Agendamento de atendimentos",
    ],
    perfil: [
      "Organização",
      "Atenção aos detalhes",
      "Boa comunicação",
      "Responsabilidade",
      "Conhecimento básico em informática",
      "Pontualidade",
      "Discrição",
    ],
  },
  {
    area: "Atendimento ao cliente",
    funcoes: [
      "Recepcionar clientes",
      "Orientar clientes",
      "Registrar solicitações",
      "Apoiar no pós-atendimento",
      "Organizar fila e ordem de atendimento",
      "Responder dúvidas simples",
    ],
    perfil: [
      "Comunicação clara",
      "Paciência",
      "Educação no atendimento",
      "Simpatia",
      "Escuta ativa",
      "Postura profissional",
      "Controle emocional",
    ],
  },
  {
    area: "Vendas",
    funcoes: [
      "Apoio na abordagem de clientes",
      "Organização de produtos",
      "Apoio em demonstração de produtos",
      "Registro de interesse de clientes",
      "Acompanhamento de metas da equipe",
      "Apoio no fechamento de vendas simples",
    ],
    perfil: [
      "Proatividade",
      "Boa comunicação",
      "Persuasão ética",
      "Interesse por vendas",
      "Saber ouvir",
      "Postura confiante",
      "Facilidade de relacionamento",
    ],
  },
  {
    area: "Operador de caixa",
    funcoes: [
      "Apoio na organização do caixa",
      "Conferência de valores sob supervisão",
      "Atendimento no balcão",
      "Emissão de comprovantes sob orientação",
      "Organização de comprovantes",
    ],
    perfil: [
      "Atenção",
      "Honestidade",
      "Responsabilidade",
      "Agilidade",
      "Concentração",
      "Noção básica de matemática",
      "Cordialidade",
    ],
  },
  {
    area: "Estoque e reposição",
    funcoes: [
      "Organização de mercadorias",
      "Reposição de produtos",
      "Conferência de validade",
      "Separação de itens",
      "Apoio em inventário",
      "Etiquetagem de produtos",
    ],
    perfil: [
      "Agilidade",
      "Organização",
      "Disposição",
      "Atenção",
      "Responsabilidade",
      "Trabalho em equipe",
    ],
  },
  {
    area: "Padaria / Mercado / Comércio",
    funcoes: [
      "Atendimento no balcão",
      "Organização de prateleiras",
      "Apoio na embalagem de produtos",
      "Controle de validade",
      "Apoio na limpeza e organização do setor",
      "Reposição de mercadorias",
    ],
    perfil: [
      "Higiene e cuidado",
      "Pontualidade",
      "Educação com clientes",
      "Agilidade",
      "Responsabilidade",
      "Trabalho em equipe",
    ],
  },
  {
    area: "Loja de roupas",
    funcoes: [
      "Organização de araras",
      "Apoio no provador",
      "Reposição de peças",
      "Atendimento inicial ao cliente",
      "Separação de mercadorias",
      "Apoio em vitrine",
    ],
    perfil: [
      "Simpatia",
      "Boa apresentação",
      "Comunicação",
      "Organização",
      "Interesse por moda",
      "Proatividade",
    ],
  },
  {
    area: "Telemarketing / Comunicação",
    funcoes: [
      "Contato com clientes",
      "Registro de atendimento",
      "Confirmação de informações",
      "Apoio em campanhas",
      "Atualização de cadastro",
      "Encaminhamento de solicitações",
    ],
    perfil: [
      "Dicção clara",
      "Escuta ativa",
      "Paciência",
      "Boa comunicação",
      "Organização",
      "Controle emocional",
      "Conhecimento básico em informática",
    ],
  },
  {
    area: "Tecnologia básica / Informática",
    funcoes: [
      "Apoio em digitação",
      "Organização de arquivos digitais",
      "Uso de planilhas simples",
      "Cadastro em sistemas",
      "Apoio em atendimento online",
      "Atualização de informações",
    ],
    perfil: [
      "Informática básica",
      "Digitação",
      "Atenção",
      "Vontade de aprender",
      "Raciocínio lógico",
      "Organização",
    ],
  },
];

export const allSkills = Array.from(
  new Set(skillGroups.flatMap((group) => [...group.perfil, ...group.funcoes]))
).sort();

export function getSkillsByArea(area: string) {
  return skillGroups.find((group) => group.area === area);
}
