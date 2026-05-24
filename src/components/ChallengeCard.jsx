import React, { useState } from 'react';
import { Building2, Trophy, Clock, ChevronDown } from 'lucide-react';

export default function ChallengeCard({ challenge, onDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Aseguramos que los datos existan para evitar errores
  const { title, description, tech, reward, deadline, tracks } = challenge;
  const orgName = challenge.organization?.full_name ?? 'Organización';
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin fecha';

  return (
    <div 
      className="bg-white dark:bg-gray-950 p-5 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer flex flex-col h-full shadow-none"
      onClick={onDetails}
    >
      {/* Encabezado: Título y Empresa */}
      <div className="mb-3 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-950 dark:text-gray-50 mb-0.5">{title}</h3>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
            <Building2 size={12} />
            <span>{orgName}</span>
          </div>
        </div>
        <span className="text-xs font-semibold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-1 rounded border border-green-100 dark:border-green-800/50 ml-2 whitespace-nowrap">
          {reward}
        </span>
      </div>

      {/* Descripción - Expandible */}
      <div className="mb-4 flex-grow">
        <p className={`text-gray-700 dark:text-gray-300 text-xs leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
          {description}
        </p>
        {description && description.length > 100 && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1 hover:underline"
          >
            {isExpanded ? 'Ver menos' : 'Ver más'} <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs mb-4">
        <Clock size={12} />
        <span>Cierra: {formattedDeadline}</span>
      </div>

      {/* Tags de Tracks */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tracks?.slice(0, 2).map((t) => (
          <span 
            key={t} 
            className="text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded"
          >
            {t}
          </span>
        ))}
        {tracks && tracks.length > 2 && (
          <span className="text-xs text-gray-500 dark:text-gray-500 px-2 py-0.5">
            +{tracks.length - 2}
          </span>
        )}
      </div>

      {/* Botón de acción */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDetails();
        }}
        className="w-full bg-blue-950 dark:bg-blue-900 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-800 transition shadow-none"
      >
        Aceptar reto
      </button>
    </div>
  );
}