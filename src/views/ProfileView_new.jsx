import React, { useState } from 'react';
import { ArrowLeft, Edit3, Globe, Building2, Briefcase, Code2, Zap, Moon, Sun } from 'lucide-react';
import { SKILLS_CATALOG, SKILL_LEVELS } from '../constants/data';
import githubLogo from '../assets/github-logo.png';
import linkedinLogo from '../assets/linkedin-logo.png';
import { useTheme } from '../useTheme';

// ==========================================
// VISTA 1: VER PERFIL - ESTILO LINKEDIN
// ==========================================
export function ProfileView({ user, setCurrentView }) {
  const { isDark, toggleTheme, theme } = useTheme();
  if (!user) return null;

  const isStudent = user.role === 'student';
  const isOrganization =
    user.role === 'organization' || user.role === 'company';

  return (
    <div className={`min-h-screen transition-colors ${theme.bg.primary}`}>
      {/* Header Navigation */}
      <div className={`border-b ${theme.border.primary} backdrop-blur-sm ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`flex items-center gap-2 ${theme.text.secondary} hover:${theme.text.primary} transition font-medium text-sm`}
          >
            <ArrowLeft size={18} /> Volver
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Profile Header Card - LinkedIn Style */}
        <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg overflow-hidden mb-8 ${theme.shadow}`}>
          
          {/* Cover Image */}
          <div className={`h-48 bg-gradient-to-r ${isDark ? 'from-indigo-900/20 to-purple-900/20' : 'from-blue-100 to-purple-100'}`}></div>

          <div className="relative px-8 pb-8">
            {/* Avatar positioned over cover */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex-shrink-0 -mt-24">
                <div className={`w-40 h-40 rounded-full border-4 ${isDark ? 'border-gray-900' : 'border-white'} overflow-hidden bg-gradient-to-br ${isDark ? 'from-indigo-600 to-purple-600' : 'from-blue-400 to-purple-400'}`}>
                  {(isStudent || isOrganization) && user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isStudent ? <Code2 size={60} className="text-white" /> : <Building2 size={60} className="text-white" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 pt-4 md:pt-12">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${theme.text.primary} mb-1`}>
                      {user.full_name || user.name || 'Usuario'}
                    </h1>
                    <p className={`text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3`}>
                      {isStudent ? user.career || 'Estudiante' : user.company_name || user.industry || 'Empresa'}
                    </p>
                    
                    {isStudent && user.bio && (
                      <p className={`${theme.text.secondary} text-sm md:text-base max-w-2xl leading-relaxed mb-4`}>
                        {user.bio}
                      </p>
                    )}

                    {isOrganization && (
                      <div className="flex flex-wrap gap-6 text-sm">
                        {user.company_size && (
                          <div className="flex items-center gap-2">
                            <Briefcase size={18} className={isDark ? 'text-indigo-400' : 'text-blue-600'} />
                            <span className={theme.text.secondary}>{user.company_size} empleados</span>
                          </div>
                        )}
                        {user.website && (
                          <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                            <Globe size={18} />
                            Sitio web
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button 
                    onClick={() => setCurrentView('edit_profile')}
                    className={`flex items-center justify-center gap-2 px-6 py-2 rounded-full font-semibold transition whitespace-nowrap ${
                      isDark 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Edit3 size={18} />
                    Editar perfil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Social Links Section - Students */}
            {isStudent && (
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-xl font-bold ${theme.text.primary} mb-6`}>Enlaces</h2>
                <div className="grid grid-cols-3 gap-4">
                  {user.github_url && (
                    <a 
                      href={user.github_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                      <img src={githubLogo} alt="GitHub" className="w-8 h-8" />
                      <span className={`text-sm font-medium ${theme.text.primary}`}>GitHub</span>
                    </a>
                  )}

                  {user.linkedin_url && (
                    <a 
                      href={user.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                      <img src={linkedinLogo} alt="LinkedIn" className="w-8 h-8" />
                      <span className={`text-sm font-medium ${theme.text.primary}`}>LinkedIn</span>
                    </a>
                  )}

                  {user.portfolio_url && (
                    <a 
                      href={user.portfolio_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-3 p-4 rounded-lg transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                      <Globe size={32} className={isDark ? 'text-indigo-400' : 'text-blue-600'} />
                      <span className={`text-sm font-medium ${theme.text.primary}`}>Portafolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Specialties / Tracks Section */}
            {isStudent && user.preferred_tracks && user.preferred_tracks.length > 0 && (
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-xl font-bold ${theme.text.primary} mb-4 flex items-center gap-2`}>
                  <Zap size={20} className={isDark ? 'text-amber-400' : 'text-yellow-500'} />
                  Especialidades
                </h2>
                <div className="flex flex-wrap gap-2">
                  {user.preferred_tracks.map((track, idx) => (
                    <span key={idx} className={`px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-blue-100 text-blue-700'}`}>
                      {track}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company About Section */}
            {isOrganization && user.bio && (
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-xl font-bold ${theme.text.primary} mb-4`}>Acerca de</h2>
                <p className={`${theme.text.secondary} leading-relaxed`}>{user.bio}</p>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            
            {/* Stats Section */}
            <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
              <h3 className={`text-sm font-bold ${theme.text.tertiary} uppercase tracking-wide mb-4`}>Estadísticas</h3>
              
              {isStudent ? (
                <>
                  <div className="mb-6">
                    <p className={`${theme.text.secondary} text-sm mb-1`}>Retos Completados</p>
                    <p className={`text-3xl font-bold ${theme.text.primary}`}>12</p>
                  </div>
                  <div className="mb-6">
                    <p className={`${theme.text.secondary} text-sm mb-1`}>Aura Score</p>
                    <p className={`text-3xl font-bold text-blue-600 dark:text-blue-400`}>{user.reputation_score || 0}</p>
                  </div>
                  <div>
                    <p className={`${theme.text.secondary} text-sm mb-1`}>Nivel</p>
                    <p className={`text-3xl font-bold text-green-600 dark:text-green-400`}>{user.level || 1}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <p className={`${theme.text.secondary} text-sm mb-2`}>Retos Activos</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${theme.text.primary}`}>8</span>
                      <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className={`${theme.text.secondary} text-sm mb-2`}>Talentos Contratados</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${theme.text.primary}`}>24</span>
                      <div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Theme Info */}
            <div className={`${theme.bg.secondary} rounded-lg p-4`}>
              <p className={`${theme.text.tertiary} text-xs text-center`}>
                {isDark ? '🌙 Modo oscuro' : '☀️ Modo claro'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA 2: EDITAR PERFIL - ESTILO LINKEDIN
// ==========================================
export function EditProfileView({ user, setUser, setCurrentView }) {
  const { isDark, toggleTheme, theme } = useTheme();
  if (!user) return null;

  const isStudent = user.role === 'student';

  return (
    <div className={`min-h-screen transition-colors ${theme.bg.primary}`}>
      {/* Header Navigation */}
      <div className={`border-b ${theme.border.primary} backdrop-blur-sm ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${theme.text.primary}`}>Editar Perfil</h1>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {isStudent ? (
          <>
            {/* Student Form */}
            <div className="space-y-6">
              
              {/* Basic Info */}
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-lg font-bold ${theme.text.primary} mb-6`}>Información Personal</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Nombre Completo</label>
                    <input 
                      type="text" 
                      value={user.full_name || ''} 
                      onChange={(e) => setUser({...user, full_name: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Carrera</label>
                    <input 
                      type="text" 
                      value={user.career || ''} 
                      onChange={(e) => setUser({...user, career: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="Tu carrera o profesión"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Bio</label>
                    <textarea 
                      value={user.bio || ''} 
                      onChange={(e) => setUser({...user, bio: e.target.value})}
                      rows="4"
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none`}
                      placeholder="Cuéntanos sobre ti..."
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-lg font-bold ${theme.text.primary} mb-6`}>Enlaces Sociales</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2 flex items-center gap-2`}>
                      <img src={githubLogo} alt="GitHub" className="w-4 h-4" />
                      GitHub
                    </label>
                    <input 
                      type="url" 
                      value={user.github_url || ''} 
                      onChange={(e) => setUser({...user, github_url: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2 flex items-center gap-2`}>
                      <img src={linkedinLogo} alt="LinkedIn" className="w-4 h-4" />
                      LinkedIn
                    </label>
                    <input 
                      type="url" 
                      value={user.linkedin_url || ''} 
                      onChange={(e) => setUser({...user, linkedin_url: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2 flex items-center gap-2`}>
                      <Globe size={16} className={isDark ? 'text-indigo-400' : 'text-blue-600'} />
                      Portafolio
                    </label>
                    <input 
                      type="url" 
                      value={user.portfolio_url || ''} 
                      onChange={(e) => setUser({...user, portfolio_url: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="https://tuportafolio.com"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-lg font-bold ${theme.text.primary} mb-6 flex items-center gap-2`}>
                  <Code2 size={20} className={isDark ? 'text-indigo-400' : 'text-blue-600'} />
                  Habilidades
                </h2>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select 
                      id="newSkillName" 
                      className={`flex-1 px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    >
                      <option value="">Selecciona una habilidad...</option>
                      {SKILLS_CATALOG.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                      id="newSkillLevel" 
                      className={`px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    >
                      {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        const nameSelect = document.getElementById('newSkillName');
                        const levelSelect = document.getElementById('newSkillLevel');
                        if (nameSelect.value && levelSelect.value) {
                          const newSkills = [...(user.skills || []), {name: nameSelect.value, level: levelSelect.value}];
                          setUser({...user, skills: newSkills});
                          nameSelect.value = '';
                          levelSelect.value = '';
                        }
                      }}
                      className={`px-4 py-3 rounded-lg font-semibold transition ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      + Añadir
                    </button>
                  </div>

                  {user.skills && user.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {skill.name}
                          <span className={`text-xs font-semibold opacity-75`}>({skill.level})</span>
                          <button
                            onClick={() => {
                              const newSkills = user.skills.filter((_, i) => i !== idx);
                              setUser({...user, skills: newSkills});
                            }}
                            className="ml-1 hover:opacity-70"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Company Form */}
            <div className="space-y-6">
              
              <div className={`${theme.bg.card} border ${theme.border.primary} rounded-lg p-6 ${theme.shadow}`}>
                <h2 className={`text-lg font-bold ${theme.text.primary} mb-6`}>Información de la Empresa</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Nombre de Empresa</label>
                    <input 
                      type="text" 
                      value={user.company_name || ''} 
                      onChange={(e) => setUser({...user, company_name: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="Nombre de tu empresa"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Industria</label>
                    <input 
                      type="text" 
                      value={user.industry || ''} 
                      onChange={(e) => setUser({...user, industry: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="Ej: Tecnología, Finanzas"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Tamaño de la Empresa</label>
                    <select 
                      value={user.company_size || ''} 
                      onChange={(e) => setUser({...user, company_size: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    >
                      <option value="">Selecciona un tamaño</option>
                      <option value="1-10">1-10 empleados</option>
                      <option value="11-50">11-50 empleados</option>
                      <option value="51-200">51-200 empleados</option>
                      <option value="201-500">201-500 empleados</option>
                      <option value="500+">500+ empleados</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2 flex items-center gap-2`}>
                      <Globe size={16} className={isDark ? 'text-indigo-400' : 'text-blue-600'} />
                      Sitio Web
                    </label>
                    <input 
                      type="url" 
                      value={user.website || ''} 
                      onChange={(e) => setUser({...user, website: e.target.value})}
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                      placeholder="https://tuempresa.com"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${theme.text.primary} mb-2`}>Acerca de la Empresa</label>
                    <textarea 
                      value={user.bio || ''} 
                      onChange={(e) => setUser({...user, bio: e.target.value})}
                      rows="5"
                      className={`w-full px-4 py-3 border ${theme.border.primary} rounded-lg ${theme.input.bg} ${theme.input.text} ${theme.input.placeholder} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none`}
                      placeholder="Cuéntanos sobre tu empresa..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Guardar Cambios
          </button>
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition border ${theme.border.primary} ${theme.text.primary} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
