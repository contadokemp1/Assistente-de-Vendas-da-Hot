
import React, { useState } from 'react';
import type { BusinessParams } from '../types';

interface BusinessParamsProps {
  params: BusinessParams;
  onParamsChange: (newParams: BusinessParams) => void;
}

const BusinessParamsEditor: React.FC<BusinessParamsProps> = ({ params, onParamsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onParamsChange({ ...params, [name]: value });
  };

  const paramFields = [
    { name: 'empresa', label: 'Nome da Empresa', placeholder: 'Ex: Acme Inc.' },
    { name: 'setorExemplo', label: 'Setor/Segmento', placeholder: 'Ex: Consultoria de Marketing' },
    { name: 'oferta', label: 'Oferta Principal', placeholder: 'Ex: Diagnóstico de SEO' },
    { name: 'promessaChave', label: 'Promessa Chave', placeholder: 'Ex: Dobramos seu tráfego em 90 dias' },
    { name: 'tomDeVoz', label: 'Tom de Voz', placeholder: 'humano, direto, gentil, consultivo' },
    { name: 'ctasDisponiveis', label: 'CTAs Disponíveis', placeholder: 'Ex: link de pagamento, link de agenda' },
    { name: 'regras', label: 'Regras/Limites', placeholder: 'Ex: Atendemos apenas SP e RJ' },
    { name: 'provas', label: 'Provas Sociais', placeholder: 'Ex: Case de sucesso da Empresa X' },
  ];

  return (
    <div className="bg-black/50 border border-hot-red/30 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-medium text-hot-white/90"
      >
        <span>Parâmetros do Negócio (Opcional)</span>
        <svg
          className={`w-5 h-5 transform transition-transform text-hot-red ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-hot-red/30 grid grid-cols-1 md:grid-cols-2 gap-4">
          {paramFields.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-hot-white/70 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                id={field.name}
                name={field.name}
                value={params[field.name as keyof BusinessParams]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-[#111] border border-hot-red/40 rounded-md text-sm shadow-sm placeholder-hot-white/40 focus:outline-none focus:ring-1 focus:ring-hot-red focus:border-hot-red text-hot-white"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessParamsEditor;