import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { UserRound, Moon, Sun } from 'lucide-react';
import LandingView from './views/LandingView';
import { ThemeProvider, useTheme } from './useTheme';


// Importa los datos estáticos
import { INITIAL_ARENA_EVENTS } from './constants/data';

// Importa todas tus vistas
import LoginView from './views/LoginView';
import { OnboardingRoleView, OnboardingProfileView } from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import { ProfileView, EditProfileView } from './views/ProfileView';
import ChallengeDetailView from './views/ChallengeDetailView';
import { CreateArenaView, ApplyArenaView } from './views/ArenaView';

export default function App() {
  // Aplicar Inter como font por defecto
  React.useEffect(() => {
    document.documentElement.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDark, toggleTheme } = useTheme();

  // ==========================================
  // 1. ESTADOS GLOBALES DE LA APLICACIÓN
  // ==========================================
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); 
  const [currentTab, setCurrentTab] = useState('challenges'); 
  
  // Datos principales
  const [challenges, setChallenges] = useState([]);
  const [arenaEvents, setArenaEvents] = useState(INITIAL_ARENA_EVENTS);
  
  // Selecciones
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedArenaEvent, setSelectedArenaEvent] = useState(null);
  const [arenaApplyMode, setArenaApplyMode] = useState(''); 

  // Formularios globales
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [onboardRole, setOnboardRole] = useState(null); 
  const [onboardData, setOnboardData] = useState({ 
    email: '', password: '', 
    name: '', preferredTracks: [], avatar: null, career: '', bio: '', linkedin: '', github: '', industry: '', companySize: '', website: '' 
  });
  const [newArenaEvent, setNewArenaEvent] = useState({ title: '', tracks: [], date: '', description: '', teamMode: 'both' });
  // Control de vista en tiempo real para evitar cierres por pérdida de foco
  const currentViewRef = React.useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);
  // ==========================================
  // 2. EFECTO 1: MANEJO DE SESIÓN Y RUTAS
  // ==========================================
  useEffect(() => {
    const checkProfileAndRoute = async (authUser) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        // Verificamos si el perfil existe E si el nombre completo ya fue rellenado
          if (profile && profile.full_name) {
          const role = profile.role === 'company' ? 'organization' : profile.role;
          setUser({
            id: authUser.id,
            ...profile,
            role,
            email: authUser.email,
          });
          
          // CAMBIO CRÍTICO AQUÍ: Solo redirigimos al dashboard si el usuario venía de afuera
          setCurrentView((prevView) => {
            if (['landing', 'login', 'onboarding_role', 'onboarding_profile'].includes(prevView)) {
              return 'dashboard';
            }
            return prevView; // Si estaba viendo un reto, lo deja en esa misma pantalla
          });
        } else {
          // Caso B: Usuario nuevo o perfil incompleto
          
          // 1. Priorizamos lo que el usuario acaba de seleccionar (para evitar errores con datos antiguos)
          const pendingRole = localStorage.getItem('aura_pending_role');
          const rawRole = pendingRole || profile?.role;
          const finalRole = rawRole === 'company' ? 'organization' : rawRole; 
          
          // 2. Pre-cargamos sus datos de Google en el formulario para que no los pierda
          setOnboardData(prev => ({
            ...prev,
            email: authUser.email,
            name: authUser.user_metadata?.full_name || profile?.full_name || prev.name || '',
            avatar: authUser.user_metadata?.avatar_url || profile?.avatar_url || prev.avatar || null
          }));

          // 3. Tomamos la decisión de a qué pantalla mandarlo
          if (finalRole) {
            // Si sabemos su rol (lo escogió recién o ya lo tenía guardado), lo mandamos a llenar sus datos específicos
            setOnboardRole(finalRole);
            setCurrentView('onboarding_profile'); 
          } else {
            // Si entró con Google directo desde el Login y es nuevo, lo mandamos a que escoja si es Empresa o Estudiante
            setCurrentView('onboarding_role');
          }
        }
      } catch (err) {
        console.error("Error interno al verificar perfil:", err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    // Revisar al cargar la página si ya hay sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkProfileAndRoute(session.user);
      } else {
        setIsCheckingSession(false); // No hay sesión, mostramos el Landing
      }
    });

    // Escuchar cambios de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Bloqueo maestro: solo se ejecuta el enrutamiento si el usuario está en pantallas de acceso exterior
        const vistasExternas = ['landing', 'login', 'onboarding_role', 'onboarding_profile'];
        if (vistasExternas.includes(currentViewRef.current)) {
          checkProfileAndRoute(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Cierre correcto del primer useEffect

  // ==========================================
  // 3. EFECTO 2: CARGA DE RETOS
  // ==========================================
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*, organization:profiles!organization_id(full_name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setChallenges(data);
        }
      } catch (err) {
        console.error("Error cargando retos:", err.message);
      }
    };

    fetchChallenges();
  }, []); // Cierre correcto del segundo useEffect

  // ==========================================
  // 4. LÓGICA GLOBAL (Funciones)
  // ==========================================
  const handleLogout = async () => {
    await supabase.auth.signOut(); 
    setUser(null);
    setCurrentView('landing'); 
    setLoginForm({ email: '', password: '' });
    setOnboardData({ email: '', password: '', name: '', preferredTracks: [], avatar: null, career: '', bio: '', linkedin: '', github: '', industry: '', companySize: '', website: '' });
    setOnboardRole(null);
    setCurrentTab('challenges');
  };
  
  // ==========================================
  // 5. RENDERIZADO PRINCIPAL
  // ==========================================
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-950"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">      
        {/* BARRA DE NAVEGACIÓN */}
        {user && (
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-8">
                  <span className="text-2xl font-extrabold text-blue-950 dark:text-blue-400 cursor-pointer" onClick={() => setCurrentView('dashboard')}>AURA</span>
                  
                  {currentView === 'dashboard' && (
                    <div className="hidden md:flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                      <button onClick={() => setCurrentTab('challenges')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${currentTab === 'challenges' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Clásicos</button>
                      {user.role === 'student' && (
                        <>
                          <button onClick={() => setCurrentTab('practice')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${currentTab === 'practice' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Para Practicar</button>
                          <button onClick={() => setCurrentTab('top')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${currentTab === 'top' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Top Semanal</button>
                        </>
                      )}
                      <button onClick={() => setCurrentTab('arena')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${currentTab === 'arena' ? 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>🔥 Arena</button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  >
                    {isDark ? <Sun size={18} className="text-gray-600 dark:text-gray-400" /> : <Moon size={18} className="text-gray-600 dark:text-gray-400" />}
                  </button>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition" onClick={() => setCurrentView('profile')}>
                     {(user.avatar_url || user.avatar) ? <img src={user.avatar_url || user.avatar} alt="Avatar" className="w-full h-full object-cover"/> : <UserRound size={16} className="text-gray-500 dark:text-gray-400"/>}
                  </div>
                  <button onClick={handleLogout} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition">Salir</button>
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* ÁREA DE CONTENIDO DINÁMICO */}
        <main className={user ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}>
          
          {currentView === 'landing' && <LandingView setCurrentView={setCurrentView} />}
          
          {currentView === 'login' && (
            <LoginView 
              setUser={setUser}
              loginForm={loginForm} 
              setLoginForm={setLoginForm} 
              setCurrentView={setCurrentView}
            />
          )}
          
          {currentView === 'onboarding_role' && <OnboardingRoleView setOnboardRole={setOnboardRole} setCurrentView={setCurrentView} />}
          
          {currentView === 'onboarding_profile' && (
            <OnboardingProfileView 
              onboardRole={onboardRole} 
              onboardData={onboardData} 
              setOnboardData={setOnboardData} 
              setUser={setUser} 
              setCurrentView={setCurrentView} 
            />
          )}
          
          {currentView === 'dashboard' && (
            <DashboardView 
              user={user} 
              currentTab={currentTab} 
              challenges={challenges}
              setChallenges={setChallenges}
              arenaEvents={arenaEvents}
              setCurrentView={setCurrentView}
              setSelectedChallenge={setSelectedChallenge}
              setSelectedArenaEvent={setSelectedArenaEvent}
              setArenaApplyMode={setArenaApplyMode}
            />
          )}
          
          {currentView === 'profile' && <ProfileView user={user} setCurrentView={setCurrentView} />}
          {currentView === 'edit_profile' && <EditProfileView user={user} setUser={setUser} setCurrentView={setCurrentView} />}
          {currentView === 'view_challenge' && (
            <ChallengeDetailView 
              selectedChallenge={selectedChallenge} 
              setCurrentView={setCurrentView} 
              user={user} 
            />
          )}
          {currentView === 'create_arena' && (
            <CreateArenaView 
              user={user}
              newArenaEvent={newArenaEvent}
              setNewArenaEvent={setNewArenaEvent}
              arenaEvents={arenaEvents}
              setArenaEvents={setArenaEvents}
              setCurrentView={setCurrentView}
              setCurrentTab={setCurrentTab}
            />
          )}
          
          {currentView === 'apply_arena' && <ApplyArenaView selectedArenaEvent={selectedArenaEvent} arenaApplyMode={arenaApplyMode} setCurrentView={setCurrentView} />}

        </main>
      </div>
    </ThemeProvider>
  );
}