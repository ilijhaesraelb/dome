import { Locale } from "@/i18n/pathwayTranslations";

export type LandingPortalCopy = {
  title: string;
  description: string;
  cta: string;
  to: string;
};

export type SiteTranslationCopy = {
  landing: {
    nav: {
      home: string;
      about: string;
      contact: string;
      signIn: string;
      findPath: string;
    };
    contactMenu: {
      label: string;
      departments: {
        title: string;
        subtitle: string;
        to: string;
      }[];
      contactForm: string;
    };
    hero: {
      titleLine1: string;
      titleLine2: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
    };
    trustSignals: string[];
    portals: {
      heading: string;
      subheading: string;
      items: LandingPortalCopy[];
    };
    howItWorks: {
      heading: string;
      subheading: string;
      steps: {
        step: string;
        title: string;
        description: string;
      }[];
    };
    platformFeatures: {
      heading: string;
      subheading: string;
      items: {
        title: string;
        description: string;
      }[];
    };
    business: {
      badge: string;
      title: string;
      description: string;
      bullets: string[];
      cta: string;
    };
    government: {
      badge: string;
      title: string;
      description: string;
      bullets: string[];
      cta: string;
    };
    security: {
      heading: string;
      subheading: string;
      items: {
        title: string;
        description: string;
      }[];
    };
    finalCta: {
      title: string;
      description: string;
      primaryCta: string;
      secondaryCta: string;
      freeLine: string;
    };
    footer: {
      tagline: string;
      links: {
        about: string;
        contact: string;
        network: string;
        business: string;
        pricing: string;
        partnerships: string;
        terms: string;
        privacy: string;
        security: string;
        platformPosition: string;
        signIn: string;
      };
      disclaimer: string;
    };
  };
  businessHome: {
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroDescription: string;
    modules: {
      title: string;
      description: string;
      href: string;
    }[];
    getStarted: string;
    helpTitle: string;
    helpDescription: string;
    hireHelp: string;
    disclaimer: string;
  };
};

export const siteTranslations: Record<Locale, SiteTranslationCopy> = {
  en: {
    landing: {
      nav: {
        home: "Home",
        about: "About",
        contact: "Contact",
        signIn: "Sign in",
        findPath: "Find My Path",
      },
      contactMenu: {
        label: "Contact a Department",
        departments: [
          { title: "General Information", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "Technical Support", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "Referrals & Partnerships", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "Billing & Subscriptions", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "Donations & Contributions", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "Contact Form",
      },
      hero: {
        titleLine1: "Simplifying Immigration",
        titleLine2: "Preparation and Opportunity",
        description:
          "D.O.M.E. provides secure digital tools that help individuals organize immigration documents, explore pathways, and connect with trusted professionals.",
        primaryCta: "Start Assessment",
        secondaryCta: "Professional / Organization Access",
      },
      trustSignals: [
        "DOJ Accredited Representative",
        "Secure Document Encryption",
        "Trusted Immigration Preparation Platform",
      ],
      portals: {
        heading: "Who Are You?",
        subheading: "Choose your path to get started with tools designed for your needs.",
        items: [
          {
            title: "Client",
            description: "I Need Immigration Help",
            cta: "Start My Journey",
            to: "/signup?role=client",
          },
          {
            title: "Legal Professional",
            description: "Immigration Attorneys and DOJ Accredited Representatives",
            cta: "Professional Portal",
            to: "/signup?role=attorney",
          },
          {
            title: "Organization",
            description: "Nonprofits and community organizations",
            cta: "Organization Portal",
            to: "/signup?role=organization",
          },
          {
            title: "Government",
            description: "Government agencies and public programs",
            cta: "Government Portal",
            to: "/signup?role=government",
          },
        ],
      },
      howItWorks: {
        heading: "How D.O.M.E. Works",
        subheading: "Three simple steps to organize your immigration journey.",
        steps: [
          {
            step: "1",
            title: "Discover Your Immigration Pathway",
            description:
              "Answer simple questions about your situation. Our engine analyzes 26+ pathways and shows your options.",
          },
          {
            step: "2",
            title: "Prepare Your Documents",
            description: "Upload, organize, and securely store all required documents in your personal vault.",
          },
          {
            step: "3",
            title: "Move Forward With Confidence",
            description:
              "Get a clear roadmap, connect with professionals, and track your progress every step of the way.",
          },
        ],
      },
      platformFeatures: {
        heading: "Platform Features",
        subheading: "Powerful tools designed to simplify every step of the immigration process.",
        items: [
          {
            title: "Immigration Pathway Finder",
            description: "Discover which visa, green card, or citizenship pathways you may be eligible for.",
          },
          {
            title: "Immigration Passport Profile",
            description:
              "Your complete immigration profile — identity, history, and documents — stored securely in one place.",
          },
          {
            title: "Secure Document Vault",
            description: "Upload, organize, and export filing packages. Encrypted and always accessible.",
          },
          {
            title: "Voice Assisted Form Guidance",
            description: "Get step-by-step help filling out immigration forms with voice-powered AI assistance.",
          },
          {
            title: "Case Readiness Score",
            description: "Know exactly how prepared your case is before submission with real-time scoring.",
          },
        ],
      },
      business: {
        badge: "Business Tools",
        title: "Start a Business in the United States",
        description:
          "D.O.M.E. provides guided workflows for entrepreneurs and immigrants looking to establish their business in the U.S.",
        bullets: ["LLC formation guidance", "Nonprofit creation", "Investor marketplace"],
        cta: "Business Launch Center",
      },
      government: {
        badge: "Institutional",
        title: "Government & Institutional Programs",
        description:
          "D.O.M.E. supports government agencies, nonprofit programs, and immigrant integration initiatives with purpose-built dashboards and reporting tools.",
        bullets: ["Program dashboards & analytics", "Participant management", "Grant-ready reporting (PDF/CSV)"],
        cta: "Learn About Partnerships",
      },
      security: {
        heading: "Your Security Is Our Priority",
        subheading: "Built from the ground up to protect your most sensitive information.",
        items: [
          {
            title: "Encrypted Document Storage",
            description: "All files are encrypted at rest and in transit using industry-standard protocols.",
          },
          {
            title: "Secure Authentication",
            description: "Multi-factor authentication and session management protect every account.",
          },
          {
            title: "Role-Based Permissions",
            description: "Users only see what they need. Strict access controls protect sensitive data.",
          },
          {
            title: "Privacy Protection",
            description: "Your data is never sold or shared. Full compliance with privacy regulations.",
          },
        ],
      },
      finalCta: {
        title: "Start Your Immigration Journey Today",
        description: "Join individuals and professionals organizing their immigration journey with D.O.M.E.",
        primaryCta: "Start Assessment",
        secondaryCta: "Professional / Organization Access",
        freeLine: "Free to start · No credit card required",
      },
      footer: {
        tagline: "D.O.M.E. — Digital Onboarding for Migration Ease",
        links: {
          about: "About Us",
          contact: "Contact",
          network: "Network",
          business: "Business Center",
          pricing: "Pricing",
          partnerships: "Partnerships",
          terms: "Terms",
          privacy: "Privacy",
          security: "Security",
          platformPosition: "Platform Position",
          signIn: "Sign in",
        },
        disclaimer:
          "D.O.M.E. is an immigration preparation tool and does not provide legal advice. For legal guidance, consult a licensed immigration attorney or DOJ-accredited representative.",
      },
    },
    businessHome: {
      heroTitleLine1: "Business Launch, Nonprofit &",
      heroTitleLine2: "Investor Center",
      heroDescription:
        "Guided workflows to start a business, launch a nonprofit, explore EB-5 investment immigration, or connect with business opportunities — all in one place.",
      modules: [
        {
          title: "Business Launch Center",
          description: "Form an LLC, Corporation, or Sole Proprietorship in any U.S. state with guided workflows.",
          href: "/business/formation",
        },
        {
          title: "Nonprofit Launch Center",
          description: "Start a nonprofit organization, prepare for 501(c)(3) status, and set up your board.",
          href: "/business/nonprofit",
        },
        {
          title: "EB-5 Investor Information",
          description: "Learn about EB-5 investment immigration, requirements, and document preparation.",
          href: "/business/eb5",
        },
        {
          title: "Business Opportunities",
          description: "Browse or post business opportunities seeking investors, partners, or buyers.",
          href: "/business/marketplace",
        },
        {
          title: "Tax Setup Center",
          description: "EIN guidance, tax classification, payroll setup, and professional tax handoff.",
          href: "/business/tax-setup",
        },
      ],
      getStarted: "Get Started",
      helpTitle: "Need Professional Help?",
      helpDescription:
        "Connect with an attorney, accredited representative, tax professional, or business support team at any point in your journey.",
      hireHelp: "Hire Help",
      disclaimer:
        "D.O.M.E. provides educational tools, guided workflows, and document organization services. D.O.M.E. does not provide legal advice, tax advice, or investment advice. State filing rules, fees, and methods vary by state and entity type. Always review official state filing office requirements before submission.",
    },
  },
  es: {
    landing: {
      nav: { home: "Inicio", about: "Acerca de", contact: "Contacto", signIn: "Iniciar sesión", findPath: "Encontrar mi ruta" },
      contactMenu: {
        label: "Contactar un departamento",
        departments: [
          { title: "Información general", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "Soporte técnico", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "Referidos y alianzas", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "Facturación y suscripciones", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "Donaciones y contribuciones", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "Formulario de contacto",
      },
      hero: {
        titleLine1: "Simplificando la inmigración",
        titleLine2: "preparación y oportunidades",
        description:
          "D.O.M.E. ofrece herramientas digitales seguras para organizar documentos migratorios, explorar opciones y conectar con profesionales confiables.",
        primaryCta: "Iniciar evaluación",
        secondaryCta: "Acceso profesional / organización",
      },
      trustSignals: ["Representante acreditado por DOJ", "Cifrado seguro de documentos", "Plataforma confiable de preparación migratoria"],
      portals: {
        heading: "¿Quién eres?",
        subheading: "Elige tu camino para comenzar con herramientas diseñadas para ti.",
        items: [
          { title: "Cliente", description: "Necesito ayuda de inmigración", cta: "Comenzar mi proceso", to: "/signup?role=client" },
          {
            title: "Profesional legal",
            description: "Abogados de inmigración y representantes acreditados por DOJ",
            cta: "Portal profesional",
            to: "/signup?role=attorney",
          },
          {
            title: "Organización",
            description: "Organizaciones comunitarias y sin fines de lucro",
            cta: "Portal de organización",
            to: "/signup?role=organization",
          },
          {
            title: "Gobierno",
            description: "Agencias gubernamentales y programas públicos",
            cta: "Portal gubernamental",
            to: "/signup?role=government",
          },
        ],
      },
      howItWorks: {
        heading: "Cómo funciona D.O.M.E.",
        subheading: "Tres pasos simples para organizar tu proceso migratorio.",
        steps: [
          {
            step: "1",
            title: "Descubre tu vía migratoria",
            description: "Responde preguntas simples. Nuestro motor analiza más de 26 vías y te muestra opciones.",
          },
          {
            step: "2",
            title: "Prepara tus documentos",
            description: "Sube, organiza y guarda de forma segura todos los documentos requeridos.",
          },
          {
            step: "3",
            title: "Avanza con confianza",
            description: "Obtén una guía clara, conecta con profesionales y sigue tu progreso en cada etapa.",
          },
        ],
      },
      platformFeatures: {
        heading: "Funciones de la plataforma",
        subheading: "Herramientas potentes para simplificar cada etapa del proceso migratorio.",
        items: [
          { title: "Buscador de vías migratorias", description: "Descubre para qué visa, green card o ciudadanía podrías calificar." },
          { title: "Perfil de pasaporte migratorio", description: "Tu perfil migratorio completo — identidad, historial y documentos — en un solo lugar." },
          { title: "Bóveda segura de documentos", description: "Sube, organiza y exporta paquetes de presentación de manera segura." },
          { title: "Asistencia por voz para formularios", description: "Recibe ayuda paso a paso con asistencia de voz con IA." },
          { title: "Puntuación de preparación del caso", description: "Conoce tu nivel de preparación antes de presentar, con puntuación en tiempo real." },
        ],
      },
      business: {
        badge: "Herramientas empresariales",
        title: "Inicia un negocio en Estados Unidos",
        description: "D.O.M.E. ofrece flujos guiados para emprendedores e inmigrantes que quieren establecer su negocio en EE. UU.",
        bullets: ["Guía para formar LLC", "Creación de organizaciones sin fines de lucro", "Mercado de inversionistas"],
        cta: "Centro de lanzamiento empresarial",
      },
      government: {
        badge: "Institucional",
        title: "Programas gubernamentales e institucionales",
        description: "D.O.M.E. apoya a agencias, programas sin fines de lucro e iniciativas de integración con paneles y reportes especializados.",
        bullets: ["Paneles y analítica de programas", "Gestión de participantes", "Reportes listos para subvenciones (PDF/CSV)"],
        cta: "Conocer alianzas",
      },
      security: {
        heading: "Tu seguridad es nuestra prioridad",
        subheading: "Diseñado desde cero para proteger tu información más sensible.",
        items: [
          { title: "Almacenamiento cifrado", description: "Todos los archivos se cifran en reposo y en tránsito con protocolos estándar." },
          { title: "Autenticación segura", description: "La autenticación multifactor y la gestión de sesiones protegen cada cuenta." },
          { title: "Permisos por rol", description: "Cada usuario ve solo lo necesario. Controles estrictos protegen datos sensibles." },
          { title: "Protección de privacidad", description: "Tus datos no se venden ni se comparten. Cumplimiento total de privacidad." },
        ],
      },
      finalCta: {
        title: "Comienza hoy tu proceso migratorio",
        description: "Únete a personas y profesionales que organizan su proceso migratorio con D.O.M.E.",
        primaryCta: "Iniciar evaluación",
        secondaryCta: "Acceso profesional / organización",
        freeLine: "Comienza gratis · No se requiere tarjeta",
      },
      footer: {
        tagline: "D.O.M.E. — Onboarding Digital para Facilitar la Migración",
        links: {
          about: "Acerca de",
          contact: "Contacto",
          network: "Red",
          business: "Centro empresarial",
          pricing: "Precios",
          partnerships: "Alianzas",
          terms: "Términos",
          privacy: "Privacidad",
          security: "Seguridad",
          platformPosition: "Posición de la plataforma",
          signIn: "Iniciar sesión",
        },
        disclaimer:
          "D.O.M.E. es una herramienta de preparación migratoria y no brinda asesoría legal. Para orientación legal, consulta con un abogado de inmigración licenciado o un representante acreditado por el DOJ.",
      },
    },
    businessHome: {
      heroTitleLine1: "Centro de negocios, nonprofit e",
      heroTitleLine2: "inversionistas",
      heroDescription:
        "Flujos guiados para iniciar un negocio, lanzar una nonprofit, explorar inmigración de inversión EB-5 o conectar con oportunidades empresariales.",
      modules: [
        {
          title: "Centro de lanzamiento empresarial",
          description: "Forma una LLC, corporación o negocio individual en cualquier estado de EE. UU. con flujos guiados.",
          href: "/business/formation",
        },
        {
          title: "Centro de lanzamiento nonprofit",
          description: "Crea una organización nonprofit, prepárate para estatus 501(c)(3) y estructura tu junta directiva.",
          href: "/business/nonprofit",
        },
        {
          title: "Información para inversionistas EB-5",
          description: "Conoce requisitos EB-5, elegibilidad y preparación de documentos.",
          href: "/business/eb5",
        },
        {
          title: "Oportunidades de negocio",
          description: "Explora o publica oportunidades que buscan inversionistas, socios o compradores.",
          href: "/business/marketplace",
        },
        {
          title: "Centro de configuración fiscal",
          description: "Guía de EIN, clasificación fiscal, nómina y entrega a profesional de impuestos.",
          href: "/business/tax-setup",
        },
      ],
      getStarted: "Comenzar",
      helpTitle: "¿Necesitas ayuda profesional?",
      helpDescription:
        "Conéctate con abogado, representante acreditado, profesional de impuestos o equipo de soporte empresarial en cualquier etapa.",
      hireHelp: "Contratar ayuda",
      disclaimer:
        "D.O.M.E. ofrece herramientas educativas y organización de documentos. No brinda asesoría legal, fiscal ni de inversión. Las reglas, tarifas y métodos de presentación varían por estado y tipo de entidad.",
    },
  },
  fr: {
    landing: {
      nav: { home: "Accueil", about: "À propos", contact: "Contact", signIn: "Se connecter", findPath: "Trouver ma voie" },
      contactMenu: {
        label: "Contacter un service",
        departments: [
          { title: "Informations générales", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "Support technique", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "Parrainages et partenariats", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "Facturation et abonnements", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "Dons et contributions", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "Formulaire de contact",
      },
      hero: {
        titleLine1: "Simplifier l’immigration",
        titleLine2: "préparation et opportunités",
        description:
          "D.O.M.E. fournit des outils numériques sécurisés pour organiser vos documents, explorer des voies d’immigration et contacter des professionnels fiables.",
        primaryCta: "Commencer l’évaluation",
        secondaryCta: "Accès professionnel / organisation",
      },
      trustSignals: ["Représentant accrédité DOJ", "Chiffrement sécurisé des documents", "Plateforme de préparation migratoire de confiance"],
      portals: {
        heading: "Qui êtes-vous ?",
        subheading: "Choisissez votre parcours pour commencer avec des outils adaptés à vos besoins.",
        items: [
          { title: "Client", description: "J’ai besoin d’aide en immigration", cta: "Commencer mon parcours", to: "/signup?role=client" },
          {
            title: "Professionnel du droit",
            description: "Avocats en immigration et représentants accrédités DOJ",
            cta: "Portail professionnel",
            to: "/signup?role=attorney",
          },
          { title: "Organisation", description: "Associations et organisations communautaires", cta: "Portail organisation", to: "/signup?role=organization" },
          { title: "Gouvernement", description: "Agences gouvernementales et programmes publics", cta: "Portail gouvernement", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "Comment fonctionne D.O.M.E.",
        subheading: "Trois étapes simples pour organiser votre parcours migratoire.",
        steps: [
          {
            step: "1",
            title: "Découvrez votre voie d’immigration",
            description: "Répondez à quelques questions. Notre moteur analyse plus de 26 voies et affiche vos options.",
          },
          {
            step: "2",
            title: "Préparez vos documents",
            description: "Téléchargez, organisez et stockez en toute sécurité les documents requis.",
          },
          {
            step: "3",
            title: "Avancez avec confiance",
            description: "Obtenez une feuille de route claire, connectez-vous à des professionnels et suivez vos progrès.",
          },
        ],
      },
      platformFeatures: {
        heading: "Fonctionnalités de la plateforme",
        subheading: "Des outils puissants pour simplifier chaque étape du processus d’immigration.",
        items: [
          { title: "Recherche de voie d’immigration", description: "Découvrez les visas, green card ou voies de citoyenneté possibles." },
          { title: "Profil passeport d’immigration", description: "Votre profil complet — identité, historique et documents — en un seul endroit." },
          { title: "Coffre-fort documentaire sécurisé", description: "Téléchargez, organisez et exportez des dossiers de dépôt en toute sécurité." },
          { title: "Guidage vocal des formulaires", description: "Recevez une aide pas à pas avec assistance vocale IA." },
          { title: "Score de préparation du dossier", description: "Mesurez votre préparation avant le dépôt avec un score en temps réel." },
        ],
      },
      business: {
        badge: "Outils business",
        title: "Créer une entreprise aux États-Unis",
        description: "D.O.M.E. propose des parcours guidés pour entrepreneurs et immigrants qui souhaitent lancer leur activité aux États-Unis.",
        bullets: ["Guidance de création LLC", "Création d’organisme à but non lucratif", "Place de marché investisseurs"],
        cta: "Centre de lancement business",
      },
      government: {
        badge: "Institutionnel",
        title: "Programmes gouvernementaux et institutionnels",
        description: "D.O.M.E. accompagne agences publiques, programmes associatifs et initiatives d’intégration avec tableaux de bord et reporting dédiés.",
        bullets: ["Tableaux de bord et analytics", "Gestion des participants", "Reporting prêt subvention (PDF/CSV)"],
        cta: "Découvrir les partenariats",
      },
      security: {
        heading: "Votre sécurité est notre priorité",
        subheading: "Conçu dès le départ pour protéger vos informations les plus sensibles.",
        items: [
          { title: "Stockage chiffré des documents", description: "Tous les fichiers sont chiffrés au repos et en transit avec des standards reconnus." },
          { title: "Authentification sécurisée", description: "L’authentification multifacteur et la gestion des sessions protègent chaque compte." },
          { title: "Permissions par rôle", description: "Chaque utilisateur voit uniquement le nécessaire. Contrôles stricts sur les données sensibles." },
          { title: "Protection de la vie privée", description: "Vos données ne sont ni vendues ni partagées. Conformité complète aux règles de confidentialité." },
        ],
      },
      finalCta: {
        title: "Commencez votre parcours migratoire dès aujourd’hui",
        description: "Rejoignez les personnes et professionnels qui organisent leur parcours avec D.O.M.E.",
        primaryCta: "Commencer l’évaluation",
        secondaryCta: "Accès professionnel / organisation",
        freeLine: "Démarrage gratuit · Sans carte bancaire",
      },
      footer: {
        tagline: "D.O.M.E. — Onboarding numérique pour faciliter la migration",
        links: {
          about: "À propos",
          contact: "Contact",
          network: "Réseau",
          business: "Centre business",
          pricing: "Tarifs",
          partnerships: "Partenariats",
          terms: "Conditions",
          privacy: "Confidentialité",
          security: "Sécurité",
          platformPosition: "Position de la plateforme",
          signIn: "Se connecter",
        },
        disclaimer:
          "D.O.M.E. est un outil de préparation à l’immigration et ne fournit pas de conseil juridique. Pour un avis juridique, consultez un avocat d’immigration agréé ou un représentant accrédité DOJ.",
      },
    },
    businessHome: {
      heroTitleLine1: "Centre business, nonprofit et",
      heroTitleLine2: "investisseurs",
      heroDescription:
        "Parcours guidés pour créer une entreprise, lancer une nonprofit, explorer l’immigration d’investissement EB-5 ou accéder à des opportunités business.",
      modules: [
        { title: "Centre de lancement business", description: "Créez une LLC, une corporation ou une entreprise individuelle dans tout État américain.", href: "/business/formation" },
        { title: "Centre de lancement nonprofit", description: "Lancez une organisation nonprofit, préparez le statut 501(c)(3) et structurez votre conseil.", href: "/business/nonprofit" },
        { title: "Informations investisseurs EB-5", description: "Découvrez les exigences EB-5 et la préparation documentaire.", href: "/business/eb5" },
        { title: "Opportunités business", description: "Consultez ou publiez des opportunités pour investisseurs, partenaires ou acquéreurs.", href: "/business/marketplace" },
        { title: "Centre de configuration fiscale", description: "Guidance EIN, classification fiscale, paie et transmission à un professionnel fiscal.", href: "/business/tax-setup" },
      ],
      getStarted: "Commencer",
      helpTitle: "Besoin d’aide professionnelle ?",
      helpDescription: "Contactez un avocat, un représentant accrédité, un fiscaliste ou une équipe de support business à tout moment.",
      hireHelp: "Trouver de l’aide",
      disclaimer:
        "D.O.M.E. fournit des outils éducatifs et d’organisation documentaire. D.O.M.E. ne fournit pas de conseils juridiques, fiscaux ou d’investissement.",
    },
  },
  ht: {
    landing: {
      nav: { home: "Akèy", about: "Sou nou", contact: "Kontak", signIn: "Konekte", findPath: "Jwenn chemen mwen" },
      contactMenu: {
        label: "Kontakte yon depatman",
        departments: [
          { title: "Enfòmasyon jeneral", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "Sipò teknik", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "Referans ak patenarya", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "Faktirasyon ak abònman", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "Don ak kontribisyon", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "Fòm kontak",
      },
      hero: {
        titleLine1: "Fè imigrasyon vin pi fasil",
        titleLine2: "preparasyon ak opòtinite",
        description:
          "D.O.M.E. bay zouti dijital ki an sekirite pou ede moun òganize dokiman imigrasyon yo, eksplore chemen yo, epi konekte ak pwofesyonèl yo fè konfyans.",
        primaryCta: "Kòmanse evalyasyon",
        secondaryCta: "Aksè pwofesyonèl / òganizasyon",
      },
      trustSignals: ["Reprezantan DOJ akredite", "Chifreman dokiman an sekirite", "Platfòm preparasyon imigrasyon ou ka fè konfyans"],
      portals: {
        heading: "Ou se kiyès?",
        subheading: "Chwazi chemen ou pou kòmanse ak zouti ki fèt pou bezwen ou.",
        items: [
          { title: "Kliyan", description: "Mwen bezwen èd imigrasyon", cta: "Kòmanse vwayaj mwen", to: "/signup?role=client" },
          { title: "Pwofesyonèl legal", description: "Avoka imigrasyon ak reprezantan DOJ akredite", cta: "Pòtal pwofesyonèl", to: "/signup?role=attorney" },
          { title: "Òganizasyon", description: "Òganizasyon kominotè ak san bi likratif", cta: "Pòtal òganizasyon", to: "/signup?role=organization" },
          { title: "Gouvènman", description: "Ajans gouvènman ak pwogram piblik", cta: "Pòtal gouvènman", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "Kijan D.O.M.E. mache",
        subheading: "Twa etap senp pou òganize vwayaj imigrasyon ou.",
        steps: [
          { step: "1", title: "Dekouvri chemen imigrasyon ou", description: "Reponn kèk kesyon senp. Sistèm nan analize plis pase 26 chemen pou ou." },
          { step: "2", title: "Prepare dokiman ou", description: "Telechaje, òganize, epi estoke tout dokiman ki nesesè yo an sekirite." },
          { step: "3", title: "Avanse avèk konfyans", description: "Jwenn yon plan klè, konekte ak pwofesyonèl, epi swiv pwogrè ou chak etap." },
        ],
      },
      platformFeatures: {
        heading: "Fonksyon platfòm nan",
        subheading: "Zouti pwisan pou fè chak etap nan pwosesis imigrasyon an pi senp.",
        items: [
          { title: "Jwenn chemen imigrasyon", description: "Dekouvri ki visa, green card oswa sitwayènte ou ka kalifye pou li." },
          { title: "Pwofil paspò imigrasyon", description: "Pwofil imigrasyon ou konplè — idantite, istwa, ak dokiman — nan yon sèl kote." },
          { title: "Vòt dokiman an sekirite", description: "Telechaje, òganize, epi ekspòte pakè dosye yo an sekirite." },
          { title: "Asistans fòm ak vwa", description: "Jwenn èd etap pa etap pou ranpli fòm yo ak asistans AI pa vwa." },
          { title: "Nòt preparasyon ka", description: "Konnen kijan ka ou pare anvan soumèt ak nòt an tan reyèl." },
        ],
      },
      business: {
        badge: "Zouti biznis",
        title: "Kòmanse yon biznis Ozetazini",
        description: "D.O.M.E. bay workflow gide pou antreprenè ak imigran ki vle lanse biznis yo Ozetazini.",
        bullets: ["Gid fòmasyon LLC", "Kreyasyon nonprofit", "Mache envestisè"],
        cta: "Sant lansman biznis",
      },
      government: {
        badge: "Enstitisyonèl",
        title: "Pwogram gouvènman ak enstitisyon",
        description: "D.O.M.E. sipòte ajans gouvènman, pwogram nonprofit, ak inisyativ entegrasyon imigran yo ak tablo done ak rapò dedye.",
        bullets: ["Tablo done ak analiz", "Jesyon patisipan", "Rapò pare pou sibvansyon (PDF/CSV)"],
        cta: "Aprann sou patenarya",
      },
      security: {
        heading: "Sekirite ou se priyorite nou",
        subheading: "Nou bati li depi baz la pou pwoteje enfòmasyon ki pi sansib ou yo.",
        items: [
          { title: "Depo dokiman chifre", description: "Tout fichye yo chifre lè yo estoke ak lè yo voye yo." },
          { title: "Otantifikasyon an sekirite", description: "MFA ak jesyon sesyon pwoteje chak kont." },
          { title: "Pèmisyon pa wòl", description: "Itilizatè yo wè sèlman sa yo bezwen. Kontwòl strik pwoteje done sansib." },
          { title: "Pwoteksyon vi prive", description: "Done ou pa vann ni pataje. Nou respekte règ vi prive yo." },
        ],
      },
      finalCta: {
        title: "Kòmanse vwayaj imigrasyon ou jodi a",
        description: "Antre nan kominote moun ak pwofesyonèl k ap òganize vwayaj imigrasyon yo ak D.O.M.E.",
        primaryCta: "Kòmanse evalyasyon",
        secondaryCta: "Aksè pwofesyonèl / òganizasyon",
        freeLine: "Gratis pou kòmanse · Pa bezwen kat kredi",
      },
      footer: {
        tagline: "D.O.M.E. — Enskripsyon Dijital pou Fè Migrasyon Pi Fasil",
        links: {
          about: "Sou nou",
          contact: "Kontak",
          network: "Rezo",
          business: "Sant biznis",
          pricing: "Pri",
          partnerships: "Patenarya",
          terms: "Kondisyon",
          privacy: "Vi prive",
          security: "Sekirite",
          platformPosition: "Pozisyon platfòm",
          signIn: "Konekte",
        },
        disclaimer:
          "D.O.M.E. se yon zouti preparasyon imigrasyon epi li pa bay konsèy legal. Pou konsèy legal, pale ak yon avoka imigrasyon ki lisansye oswa yon reprezantan DOJ akredite.",
      },
    },
    businessHome: {
      heroTitleLine1: "Sant lansman biznis, nonprofit ak",
      heroTitleLine2: "envestisè",
      heroDescription:
        "Workflow gide pou kòmanse biznis, lanse nonprofit, eksplore imigrasyon envestisman EB-5, oswa konekte ak opòtinite biznis.",
      modules: [
        { title: "Sant lansman biznis", description: "Fòme LLC, korporasyon oswa biznis endividyèl nan nenpòt eta ameriken.", href: "/business/formation" },
        { title: "Sant lansman nonprofit", description: "Kòmanse yon òganizasyon nonprofit, prepare pou estati 501(c)(3), epi mete konsèy administrasyon ou sou pye.", href: "/business/nonprofit" },
        { title: "Enfòmasyon envestisè EB-5", description: "Aprann sou egzijans EB-5 ak preparasyon dokiman.", href: "/business/eb5" },
        { title: "Opòtinite biznis", description: "Chèche oswa poste opòtinite pou envestisè, patnè, oswa achtè.", href: "/business/marketplace" },
        { title: "Sant konfigirasyon taks", description: "Gid EIN, klasifikasyon taks, sistèm pewòl, ak transfè bay pwofesyonèl taks.", href: "/business/tax-setup" },
      ],
      getStarted: "Kòmanse",
      helpTitle: "Ou bezwen èd pwofesyonèl?",
      helpDescription: "Konekte ak yon avoka, reprezantan akredite, pwofesyonèl taks, oswa ekip sipò biznis nenpòt lè.",
      hireHelp: "Anboche èd",
      disclaimer:
        "D.O.M.E. bay zouti edikatif, workflow gide, ak sèvis òganizasyon dokiman. D.O.M.E. pa bay konsèy legal, taks oswa envestisman.",
    },
  },
  ja: {
    landing: {
      nav: { home: "ホーム", about: "概要", contact: "お問い合わせ", signIn: "サインイン", findPath: "私のルートを探す" },
      contactMenu: {
        label: "部署に連絡",
        departments: [
          { title: "一般情報", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "技術サポート", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "紹介・提携", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "請求・サブスクリプション", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "寄付・貢献", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "お問い合わせフォーム",
      },
      hero: {
        titleLine1: "移民準備をもっと簡単に",
        titleLine2: "機会へのアクセスをもっと身近に",
        description:
          "D.O.M.E. は、移民書類の整理、進路の検討、信頼できる専門家との連携を支援する安全なデジタルツールを提供します。",
        primaryCta: "診断を開始",
        secondaryCta: "専門家 / 組織向けアクセス",
      },
      trustSignals: ["DOJ認定代表者", "安全な書類暗号化", "信頼される移民準備プラットフォーム"],
      portals: {
        heading: "あなたはどちらですか？",
        subheading: "あなたに合ったツールで最適なスタートを選びましょう。",
        items: [
          { title: "クライアント", description: "移民サポートが必要", cta: "手続きを開始", to: "/signup?role=client" },
          { title: "法律専門家", description: "移民弁護士・DOJ認定代表者", cta: "専門家ポータル", to: "/signup?role=attorney" },
          { title: "団体", description: "非営利団体・コミュニティ組織", cta: "団体ポータル", to: "/signup?role=organization" },
          { title: "政府", description: "政府機関・公共プログラム", cta: "政府ポータル", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "D.O.M.E. の使い方",
        subheading: "移民手続きを整理するための3つの簡単なステップ。",
        steps: [
          { step: "1", title: "移民ルートを確認", description: "いくつかの質問に答えると、26以上のルートから可能性を表示します。" },
          { step: "2", title: "書類を準備", description: "必要書類をアップロードして安全に整理・保管します。" },
          { step: "3", title: "自信を持って前進", description: "明確なロードマップ、専門家連携、進捗管理を一つの場所で。" },
        ],
      },
      platformFeatures: {
        heading: "プラットフォーム機能",
        subheading: "移民手続きの各ステップをシンプルにする強力な機能。",
        items: [
          { title: "移民ルートファインダー", description: "ビザ、グリーンカード、市民権の可能性を確認。" },
          { title: "移民パスポートプロフィール", description: "本人情報・履歴・書類を1か所に安全保存。" },
          { title: "安全な書類保管庫", description: "提出パッケージをアップロード、整理、エクスポート。" },
          { title: "音声フォーム支援", description: "AI音声でフォーム入力をステップごとに案内。" },
          { title: "ケース準備スコア", description: "提出前の準備度をリアルタイムで把握。" },
        ],
      },
      business: {
        badge: "ビジネスツール",
        title: "米国でビジネスを始める",
        description: "D.O.M.E. は、起業家や移民向けに、米国での事業立ち上げをガイド付きで支援します。",
        bullets: ["LLC設立ガイド", "非営利団体設立", "投資家マーケットプレイス"],
        cta: "ビジネス立ち上げセンター",
      },
      government: {
        badge: "機関向け",
        title: "政府・機関向けプログラム",
        description: "D.O.M.E. は、政府機関、非営利プログラム、移民統合施策を専用ダッシュボードとレポートで支援します。",
        bullets: ["プログラムダッシュボードと分析", "参加者管理", "助成金向けレポート（PDF/CSV）"],
        cta: "提携について見る",
      },
      security: {
        heading: "セキュリティは最優先です",
        subheading: "最も重要な情報を守るために、基盤から設計されています。",
        items: [
          { title: "暗号化された書類保存", description: "すべてのファイルは保存時・通信時の両方で暗号化されます。" },
          { title: "安全な認証", description: "多要素認証とセッション管理で各アカウントを保護。" },
          { title: "ロールベース権限", description: "必要な情報だけを表示し、厳格なアクセス制御を実施。" },
          { title: "プライバシー保護", description: "データの販売・共有は行いません。プライバシー規制に準拠。" },
        ],
      },
      finalCta: {
        title: "今すぐ移民ジャーニーを始めましょう",
        description: "D.O.M.E. で移民準備を進める個人と専門家のコミュニティに参加。",
        primaryCta: "診断を開始",
        secondaryCta: "専門家 / 組織向けアクセス",
        freeLine: "無料で開始 · クレジットカード不要",
      },
      footer: {
        tagline: "D.O.M.E. — 移民を円滑にするデジタルオンボーディング",
        links: {
          about: "概要",
          contact: "お問い合わせ",
          network: "ネットワーク",
          business: "ビジネスセンター",
          pricing: "料金",
          partnerships: "提携",
          terms: "利用規約",
          privacy: "プライバシー",
          security: "セキュリティ",
          platformPosition: "プラットフォームの立場",
          signIn: "サインイン",
        },
        disclaimer:
          "D.O.M.E. は移民準備ツールであり、法的助言を提供しません。法的な判断には、認可された移民弁護士またはDOJ認定代表者に相談してください。",
      },
    },
    businessHome: {
      heroTitleLine1: "ビジネス・非営利・",
      heroTitleLine2: "投資家センター",
      heroDescription:
        "ビジネス開始、非営利立ち上げ、EB-5投資移民の検討、ビジネス機会の探索を一つの場所で。",
      modules: [
        { title: "ビジネス立ち上げセンター", description: "米国各州で LLC・法人・個人事業の設立をガイド付きでサポート。", href: "/business/formation" },
        { title: "非営利立ち上げセンター", description: "非営利団体の設立、501(c)(3)準備、理事会構成を支援。", href: "/business/nonprofit" },
        { title: "EB-5投資家情報", description: "EB-5の要件、適格性、必要書類を学べます。", href: "/business/eb5" },
        { title: "ビジネス機会", description: "投資家・共同創業者・買い手向けの案件を閲覧または掲載。", href: "/business/marketplace" },
        { title: "税務設定センター", description: "EIN、税区分、給与設定、税務専門家への引き継ぎまで案内。", href: "/business/tax-setup" },
      ],
      getStarted: "開始する",
      helpTitle: "専門家のサポートが必要ですか？",
      helpDescription: "弁護士、認定代表者、税務専門家、ビジネス支援チームにいつでも接続できます。",
      hireHelp: "サポートを探す",
      disclaimer:
        "D.O.M.E. は教育用ツールと書類整理サービスを提供します。法律・税務・投資アドバイスは提供しません。",
    },
  },
  ur: {
    landing: {
      nav: { home: "ہوم", about: "ہمارے بارے میں", contact: "رابطہ", signIn: "سائن اِن", findPath: "میرا راستہ تلاش کریں" },
      contactMenu: {
        label: "شعبے سے رابطہ کریں",
        departments: [
          { title: "عمومی معلومات", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "تکنیکی معاونت", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "ریفرلز اور شراکتیں", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "بلنگ اور سبسکرپشنز", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "عطیات اور تعاون", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "رابطہ فارم",
      },
      hero: {
        titleLine1: "امیگریشن کو آسان بنانا",
        titleLine2: "تیاری اور مواقع",
        description:
          "D.O.M.E. محفوظ ڈیجیٹل ٹولز فراہم کرتا ہے جو امیگریشن دستاویزات کو منظم کرنے، راستے تلاش کرنے، اور قابلِ اعتماد ماہرین سے جڑنے میں مدد دیتے ہیں۔",
        primaryCta: "اسیسمنٹ شروع کریں",
        secondaryCta: "پروفیشنل / تنظیمی رسائی",
      },
      trustSignals: ["DOJ سے منظور شدہ نمائندہ", "محفوظ دستاویزی انکرپشن", "قابلِ اعتماد امیگریشن تیاری پلیٹ فارم"],
      portals: {
        heading: "آپ کون ہیں؟",
        subheading: "اپنی ضرورت کے مطابق راستہ منتخب کریں اور آغاز کریں۔",
        items: [
          { title: "کلائنٹ", description: "مجھے امیگریشن مدد چاہیے", cta: "میرا سفر شروع کریں", to: "/signup?role=client" },
          { title: "قانونی پیشہ ور", description: "امیگریشن وکلا اور DOJ منظور شدہ نمائندے", cta: "پروفیشنل پورٹل", to: "/signup?role=attorney" },
          { title: "تنظیم", description: "غیر منافع بخش اور کمیونٹی تنظیمیں", cta: "تنظیمی پورٹل", to: "/signup?role=organization" },
          { title: "حکومت", description: "سرکاری ادارے اور عوامی پروگرام", cta: "گورنمنٹ پورٹل", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "D.O.M.E. کیسے کام کرتا ہے",
        subheading: "آپ کے امیگریشن سفر کو منظم کرنے کے تین آسان مراحل۔",
        steps: [
          { step: "1", title: "اپنا امیگریشن راستہ دریافت کریں", description: "چند سادہ سوالات کے جواب دیں۔ ہمارا انجن 26+ راستے جانچتا ہے۔" },
          { step: "2", title: "اپنے دستاویزات تیار کریں", description: "تمام مطلوبہ دستاویزات اپ لوڈ کریں اور محفوظ طریقے سے منظم کریں۔" },
          { step: "3", title: "اعتماد کے ساتھ آگے بڑھیں", description: "واضح روڈمیپ حاصل کریں، ماہرین سے جڑیں، اور پیش رفت ٹریک کریں۔" },
        ],
      },
      platformFeatures: {
        heading: "پلیٹ فارم فیچرز",
        subheading: "امیگریشن عمل کے ہر مرحلے کو آسان بنانے کے لیے مضبوط ٹولز۔",
        items: [
          { title: "امیگریشن راستہ فائنڈر", description: "جانیے آپ کس ویزا، گرین کارڈ یا شہریت کے لیے اہل ہو سکتے ہیں۔" },
          { title: "امیگریشن پاسپورٹ پروفائل", description: "آپ کا مکمل پروفائل — شناخت، ہسٹری اور دستاویزات — ایک جگہ محفوظ۔" },
          { title: "محفوظ دستاویزی والٹ", description: "فائلنگ پیکجز اپ لوڈ، منظم اور ایکسپورٹ کریں۔" },
          { title: "آواز کے ذریعے فارم رہنمائی", description: "AI آواز کے ساتھ مرحلہ وار فارم مدد حاصل کریں۔" },
          { title: "کیس ریڈینس اسکور", description: "جمع کرانے سے پہلے اپنی تیاری کا ریئل ٹائم اسکور دیکھیں۔" },
        ],
      },
      business: {
        badge: "کاروباری ٹولز",
        title: "امریکہ میں کاروبار شروع کریں",
        description: "D.O.M.E. کاروبار شروع کرنے والے تارکین وطن اور کاروباری افراد کے لیے رہنمائی فراہم کرتا ہے۔",
        bullets: ["LLC تشکیل رہنمائی", "نان پرافٹ تشکیل", "سرمایہ کار مارکیٹ پلیس"],
        cta: "بزنس لانچ سینٹر",
      },
      government: {
        badge: "ادارہ جاتی",
        title: "حکومتی اور ادارہ جاتی پروگرامز",
        description: "D.O.M.E. حکومتی اداروں، نان پرافٹ پروگرامز، اور انضمامی اقدامات کو ڈیش بورڈز اور رپورٹنگ کے ذریعے سپورٹ کرتا ہے۔",
        bullets: ["پروگرام ڈیش بورڈز اور اینالیٹکس", "شرکاء کا انتظام", "گرانٹ کے لیے تیار رپورٹنگ (PDF/CSV)"],
        cta: "شراکتوں کے بارے میں جانیں",
      },
      security: {
        heading: "آپ کی سیکیورٹی ہماری ترجیح ہے",
        subheading: "آپ کی حساس معلومات کے تحفظ کے لیے بنیاد سے تیار کیا گیا ہے۔",
        items: [
          { title: "انکرپٹڈ دستاویز اسٹوریج", description: "تمام فائلیں محفوظ پروٹوکول کے ساتھ اسٹور اور ٹرانسفر کے دوران انکرپٹ ہوتی ہیں۔" },
          { title: "محفوظ تصدیق", description: "ملٹی فیکٹر تصدیق اور سیشن مینجمنٹ ہر اکاؤنٹ کو محفوظ رکھتے ہیں۔" },
          { title: "رول بیسڈ اجازتیں", description: "ہر صارف صرف ضروری معلومات دیکھتا ہے۔" },
          { title: "پرائیویسی تحفظ", description: "آپ کا ڈیٹا نہ فروخت ہوتا ہے نہ شیئر۔" },
        ],
      },
      finalCta: {
        title: "اپنا امیگریشن سفر آج شروع کریں",
        description: "ان افراد اور ماہرین میں شامل ہوں جو D.O.M.E. کے ساتھ اپنا سفر منظم کر رہے ہیں۔",
        primaryCta: "اسیسمنٹ شروع کریں",
        secondaryCta: "پروفیشنل / تنظیمی رسائی",
        freeLine: "مفت آغاز · کریڈٹ کارڈ درکار نہیں",
      },
      footer: {
        tagline: "D.O.M.E. — ہجرت کو آسان بنانے کے لیے ڈیجیٹل آن بورڈنگ",
        links: {
          about: "ہمارے بارے میں",
          contact: "رابطہ",
          network: "نیٹ ورک",
          business: "بزنس سینٹر",
          pricing: "قیمتیں",
          partnerships: "شراکتیں",
          terms: "شرائط",
          privacy: "پرائیویسی",
          security: "سیکیورٹی",
          platformPosition: "پلیٹ فارم پوزیشن",
          signIn: "سائن اِن",
        },
        disclaimer:
          "D.O.M.E. امیگریشن تیاری کا ٹول ہے اور قانونی مشورہ فراہم نہیں کرتا۔ قانونی رہنمائی کے لیے لائسنس یافتہ امیگریشن وکیل یا DOJ منظور شدہ نمائندے سے رجوع کریں۔",
      },
    },
    businessHome: {
      heroTitleLine1: "بزنس لانچ، نان پرافٹ اور",
      heroTitleLine2: "انویسٹر سینٹر",
      heroDescription:
        "کاروبار شروع کرنے، نان پرافٹ بنانے، EB-5 سرمایہ کاری امیگریشن جانچنے، یا کاروباری مواقع سے جڑنے کے لیے رہنمائی شدہ ورک فلو۔",
      modules: [
        { title: "بزنس لانچ سینٹر", description: "امریکہ کی کسی بھی ریاست میں LLC، کارپوریشن یا واحد ملکیت کی تشکیل کے لیے رہنمائی۔", href: "/business/formation" },
        { title: "نان پرافٹ لانچ سینٹر", description: "نان پرافٹ تنظیم شروع کریں، 501(c)(3) اسٹیٹس کی تیاری کریں، اور بورڈ سیٹ اپ کریں۔", href: "/business/nonprofit" },
        { title: "EB-5 سرمایہ کار معلومات", description: "EB-5 ضروریات اور دستاویز تیاری کے بارے میں جانیں۔", href: "/business/eb5" },
        { title: "کاروباری مواقع", description: "سرمایہ کاروں، شراکت داروں یا خریداروں کے لیے مواقع براؤز یا پوسٹ کریں۔", href: "/business/marketplace" },
        { title: "ٹیکس سیٹ اپ سینٹر", description: "EIN، ٹیکس درجہ بندی، پے رول سیٹ اپ، اور ٹیکس پروفیشنل ہینڈ آف۔", href: "/business/tax-setup" },
      ],
      getStarted: "شروع کریں",
      helpTitle: "پروفیشنل مدد چاہیے؟",
      helpDescription: "اپنے سفر کے کسی بھی مرحلے پر وکیل، منظور شدہ نمائندے، ٹیکس پروفیشنل یا بزنس سپورٹ ٹیم سے جڑیں۔",
      hireHelp: "مدد حاصل کریں",
      disclaimer:
        "D.O.M.E. تعلیمی ٹولز اور دستاویز تنظیم خدمات فراہم کرتا ہے۔ یہ قانونی، ٹیکس یا سرمایہ کاری مشورہ فراہم نہیں کرتا۔",
    },
  },
  hi: {
    landing: {
      nav: { home: "होम", about: "हमारे बारे में", contact: "संपर्क", signIn: "साइन इन", findPath: "मेरा रास्ता खोजें" },
      contactMenu: {
        label: "विभाग से संपर्क करें",
        departments: [
          { title: "सामान्य जानकारी", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "तकनीकी सहायता", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "रेफ़रल और पार्टनरशिप", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "बिलिंग और सब्सक्रिप्शन", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "दान और योगदान", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "संपर्क फ़ॉर्म",
      },
      hero: {
        titleLine1: "इमिग्रेशन को सरल बनाना",
        titleLine2: "तैयारी और अवसर",
        description:
          "D.O.M.E. सुरक्षित डिजिटल टूल्स देता है जो लोगों को दस्तावेज़ व्यवस्थित करने, विकल्प खोजने और भरोसेमंद विशेषज्ञों से जुड़ने में मदद करते हैं।",
        primaryCta: "आकलन शुरू करें",
        secondaryCta: "प्रोफ़ेशनल / संगठन एक्सेस",
      },
      trustSignals: ["DOJ मान्यता प्राप्त प्रतिनिधि", "सुरक्षित दस्तावेज़ एन्क्रिप्शन", "विश्वसनीय इमिग्रेशन तैयारी प्लेटफ़ॉर्म"],
      portals: {
        heading: "आप कौन हैं?",
        subheading: "अपनी ज़रूरत के अनुसार रास्ता चुनें और शुरुआत करें।",
        items: [
          { title: "क्लाइंट", description: "मुझे इमिग्रेशन मदद चाहिए", cta: "मेरा सफर शुरू करें", to: "/signup?role=client" },
          { title: "कानूनी पेशेवर", description: "इमिग्रेशन वकील और DOJ मान्यता प्राप्त प्रतिनिधि", cta: "प्रोफ़ेशनल पोर्टल", to: "/signup?role=attorney" },
          { title: "संगठन", description: "गैर-लाभकारी और सामुदायिक संगठन", cta: "संगठन पोर्टल", to: "/signup?role=organization" },
          { title: "सरकार", description: "सरकारी एजेंसियां और सार्वजनिक कार्यक्रम", cta: "सरकारी पोर्टल", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "D.O.M.E. कैसे काम करता है",
        subheading: "आपकी इमिग्रेशन यात्रा को व्यवस्थित करने के तीन सरल चरण।",
        steps: [
          { step: "1", title: "अपना इमिग्रेशन पाथवे खोजें", description: "कुछ सरल प्रश्नों का उत्तर दें। हमारा इंजन 26+ पाथवे का विश्लेषण करता है।" },
          { step: "2", title: "अपने दस्तावेज़ तैयार करें", description: "ज़रूरी दस्तावेज़ अपलोड करें, व्यवस्थित करें और सुरक्षित रखें।" },
          { step: "3", title: "आत्मविश्वास से आगे बढ़ें", description: "स्पष्ट रोडमैप पाएं, विशेषज्ञों से जुड़ें और हर चरण का प्रोग्रेस ट्रैक करें।" },
        ],
      },
      platformFeatures: {
        heading: "प्लेटफ़ॉर्म सुविधाएँ",
        subheading: "इमिग्रेशन प्रक्रिया के हर चरण को सरल बनाने के लिए शक्तिशाली टूल्स।",
        items: [
          { title: "इमिग्रेशन पाथवे फाइंडर", description: "जानें कि आप किस वीज़ा, ग्रीन कार्ड या नागरिकता विकल्प के लिए पात्र हो सकते हैं।" },
          { title: "इमिग्रेशन पासपोर्ट प्रोफ़ाइल", description: "आपकी पहचान, इतिहास और दस्तावेज़ एक ही सुरक्षित जगह पर।" },
          { title: "सुरक्षित दस्तावेज़ वॉल्ट", description: "फ़ाइलिंग पैकेज अपलोड, व्यवस्थित और एक्सपोर्ट करें।" },
          { title: "वॉइस फॉर्म गाइडेंस", description: "AI वॉइस के साथ चरण-दर-चरण फॉर्म सहायता पाएं।" },
          { title: "केस रेडीनेस स्कोर", description: "सबमिशन से पहले अपनी तैयारी का रियल-टाइम स्कोर जानें।" },
        ],
      },
      business: {
        badge: "बिजनेस टूल्स",
        title: "संयुक्त राज्य में बिजनेस शुरू करें",
        description: "D.O.M.E. उद्यमियों और प्रवासियों के लिए गाइडेड वर्कफ़्लो देता है जो अमेरिका में बिजनेस शुरू करना चाहते हैं।",
        bullets: ["LLC गठन गाइडेंस", "नॉनप्रॉफिट निर्माण", "निवेशक मार्केटप्लेस"],
        cta: "बिजनेस लॉन्च सेंटर",
      },
      government: {
        badge: "संस्थागत",
        title: "सरकारी और संस्थागत कार्यक्रम",
        description: "D.O.M.E. सरकारी एजेंसियों, नॉनप्रॉफिट कार्यक्रमों और इंटीग्रेशन पहलों को डैशबोर्ड और रिपोर्टिंग से समर्थन देता है।",
        bullets: ["प्रोग्राम डैशबोर्ड और एनालिटिक्स", "प्रतिभागी प्रबंधन", "ग्रांट-रेडी रिपोर्टिंग (PDF/CSV)"],
        cta: "पार्टनरशिप के बारे में जानें",
      },
      security: {
        heading: "आपकी सुरक्षा हमारी प्राथमिकता है",
        subheading: "आपकी संवेदनशील जानकारी की सुरक्षा के लिए शुरुआत से बनाया गया।",
        items: [
          { title: "एन्क्रिप्टेड दस्तावेज़ स्टोरेज", description: "सभी फाइलें स्टोरेज और ट्रांजिट दोनों में एन्क्रिप्टेड रहती हैं।" },
          { title: "सुरक्षित ऑथेंटिकेशन", description: "मल्टी-फैक्टर ऑथ और सत्र प्रबंधन हर खाते को सुरक्षित रखते हैं।" },
          { title: "रोल-आधारित अनुमतियाँ", description: "उपयोगकर्ता केवल वही देखते हैं जो आवश्यक है।" },
          { title: "प्राइवेसी सुरक्षा", description: "आपका डेटा न बेचा जाता है, न साझा किया जाता है।" },
        ],
      },
      finalCta: {
        title: "आज ही अपनी इमिग्रेशन यात्रा शुरू करें",
        description: "उन लोगों और पेशेवरों के साथ जुड़ें जो D.O.M.E. के साथ अपनी यात्रा व्यवस्थित कर रहे हैं।",
        primaryCta: "आकलन शुरू करें",
        secondaryCta: "प्रोफ़ेशनल / संगठन एक्सेस",
        freeLine: "शुरुआत मुफ़्त · क्रेडिट कार्ड की आवश्यकता नहीं",
      },
      footer: {
        tagline: "D.O.M.E. — Migration Ease के लिए डिजिटल ऑनबोर्डिंग",
        links: {
          about: "हमारे बारे में",
          contact: "संपर्क",
          network: "नेटवर्क",
          business: "बिजनेस सेंटर",
          pricing: "प्राइसिंग",
          partnerships: "पार्टनरशिप",
          terms: "शर्तें",
          privacy: "गोपनीयता",
          security: "सुरक्षा",
          platformPosition: "प्लेटफ़ॉर्म स्थिति",
          signIn: "साइन इन",
        },
        disclaimer:
          "D.O.M.E. इमिग्रेशन तैयारी टूल है और कानूनी सलाह नहीं देता। कानूनी मार्गदर्शन के लिए लाइसेंस प्राप्त इमिग्रेशन वकील या DOJ-मान्यता प्राप्त प्रतिनिधि से सलाह लें।",
      },
    },
    businessHome: {
      heroTitleLine1: "बिजनेस लॉन्च, नॉनप्रॉफिट और",
      heroTitleLine2: "निवेशक केंद्र",
      heroDescription:
        "बिजनेस शुरू करने, नॉनप्रॉफिट लॉन्च करने, EB-5 निवेश इमिग्रेशन समझने या बिजनेस अवसरों से जुड़ने के लिए गाइडेड वर्कफ़्लो।",
      modules: [
        { title: "बिजनेस लॉन्च सेंटर", description: "किसी भी अमेरिकी राज्य में LLC, Corporation या Sole Proprietorship बनाने के लिए गाइडेड प्रक्रिया।", href: "/business/formation" },
        { title: "नॉनप्रॉफिट लॉन्च सेंटर", description: "नॉनप्रॉफिट शुरू करें, 501(c)(3) तैयारी करें और बोर्ड सेटअप करें।", href: "/business/nonprofit" },
        { title: "EB-5 निवेशक जानकारी", description: "EB-5 आवश्यकताओं और दस्तावेज़ तैयारी के बारे में जानें।", href: "/business/eb5" },
        { title: "बिजनेस अवसर", description: "निवेशकों, भागीदारों या खरीदारों के लिए अवसर देखें या पोस्ट करें।", href: "/business/marketplace" },
        { title: "टैक्स सेटअप सेंटर", description: "EIN गाइडेंस, टैक्स क्लासिफिकेशन, पेरोल सेटअप और प्रोफेशनल टैक्स हैंडऑफ।", href: "/business/tax-setup" },
      ],
      getStarted: "शुरू करें",
      helpTitle: "क्या आपको पेशेवर सहायता चाहिए?",
      helpDescription: "अपने सफर के किसी भी चरण में वकील, मान्यता प्राप्त प्रतिनिधि, टैक्स विशेषज्ञ या बिजनेस सपोर्ट टीम से जुड़ें।",
      hireHelp: "सहायता लें",
      disclaimer:
        "D.O.M.E. शैक्षिक टूल्स और दस्तावेज़ संगठन सेवाएँ प्रदान करता है। यह कानूनी, टैक्स या निवेश सलाह प्रदान नहीं करता।",
    },
  },
  zh: {
    landing: {
      nav: { home: "首页", about: "关于", contact: "联系", signIn: "登录", findPath: "查找我的路径" },
      contactMenu: {
        label: "联系部门",
        departments: [
          { title: "一般咨询", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "技术支持", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "推荐与合作", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "账单与订阅", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "捐赠与贡献", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "联系表单",
      },
      hero: {
        titleLine1: "让移民准备更简单",
        titleLine2: "让机会更清晰",
        description:
          "D.O.M.E. 提供安全的数字工具，帮助个人整理移民文件、探索路径并连接值得信赖的专业人士。",
        primaryCta: "开始评估",
        secondaryCta: "专业人士 / 机构入口",
      },
      trustSignals: ["DOJ 认证代表", "安全文档加密", "可信赖的移民准备平台"],
      portals: {
        heading: "您是哪一类用户？",
        subheading: "选择适合您的路径，使用为您需求设计的工具开始。",
        items: [
          { title: "个人用户", description: "我需要移民帮助", cta: "开始我的旅程", to: "/signup?role=client" },
          { title: "法律专业人士", description: "移民律师与 DOJ 认证代表", cta: "专业门户", to: "/signup?role=attorney" },
          { title: "机构", description: "非营利与社区组织", cta: "机构门户", to: "/signup?role=organization" },
          { title: "政府", description: "政府机构与公共项目", cta: "政府门户", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "D.O.M.E. 如何运作",
        subheading: "三步即可组织您的移民流程。",
        steps: [
          { step: "1", title: "发现您的移民路径", description: "回答几个简单问题，系统将分析 26+ 路径并给出选项。" },
          { step: "2", title: "准备您的文件", description: "上传、整理并安全存储所有必需文件。" },
          { step: "3", title: "更有信心地前进", description: "获得清晰路线图，连接专业人士，并跟踪每一步进度。" },
        ],
      },
      platformFeatures: {
        heading: "平台功能",
        subheading: "强大工具，简化移民流程的每一步。",
        items: [
          { title: "移民路径查找器", description: "了解您可能符合的签证、绿卡或入籍路径。" },
          { title: "移民护照档案", description: "身份、历史和文件集中在一个安全位置。" },
          { title: "安全文档仓库", description: "上传、整理并导出申请材料包。" },
          { title: "语音表单辅助", description: "通过 AI 语音获得逐步填表帮助。" },
          { title: "案件准备评分", description: "提交前实时了解案件准备程度。" },
        ],
      },
      business: {
        badge: "商业工具",
        title: "在美国创业",
        description: "D.O.M.E. 为创业者和移民提供引导式流程，帮助在美国建立企业。",
        bullets: ["LLC 设立指导", "非营利组织创建", "投资者市场"],
        cta: "商业启动中心",
      },
      government: {
        badge: "机构方案",
        title: "政府与机构项目",
        description: "D.O.M.E. 为政府机构、非营利项目和移民融合计划提供专用仪表盘与报告工具。",
        bullets: ["项目仪表盘与分析", "参与者管理", "可用于资助申请的报告（PDF/CSV）"],
        cta: "了解合作",
      },
      security: {
        heading: "您的安全是我们的首要任务",
        subheading: "从底层设计开始保护您最敏感的信息。",
        items: [
          { title: "加密文档存储", description: "所有文件在存储和传输过程中均采用行业标准加密。" },
          { title: "安全身份验证", description: "多因素认证与会话管理保护每个账户。" },
          { title: "基于角色的权限", description: "用户仅查看所需内容，严格访问控制保护敏感数据。" },
          { title: "隐私保护", description: "您的数据不会被出售或共享，全面遵守隐私法规。" },
        ],
      },
      finalCta: {
        title: "今天就开始您的移民旅程",
        description: "加入正在使用 D.O.M.E. 组织移民流程的个人与专业人士。",
        primaryCta: "开始评估",
        secondaryCta: "专业人士 / 机构入口",
        freeLine: "免费开始 · 无需信用卡",
      },
      footer: {
        tagline: "D.O.M.E. — 让移民更顺畅的数字化入门平台",
        links: {
          about: "关于我们",
          contact: "联系",
          network: "网络",
          business: "商业中心",
          pricing: "价格",
          partnerships: "合作",
          terms: "条款",
          privacy: "隐私",
          security: "安全",
          platformPosition: "平台立场",
          signIn: "登录",
        },
        disclaimer:
          "D.O.M.E. 是移民准备工具，不提供法律建议。法律问题请咨询持牌移民律师或 DOJ 认证代表。",
      },
    },
    businessHome: {
      heroTitleLine1: "商业启动、非营利与",
      heroTitleLine2: "投资者中心",
      heroDescription: "通过引导式流程启动企业、创建非营利组织、了解 EB-5 投资移民，并连接商业机会。",
      modules: [
        { title: "商业启动中心", description: "在美国任意州以引导流程设立 LLC、公司或个体经营。", href: "/business/formation" },
        { title: "非营利启动中心", description: "创建非营利组织，准备 501(c)(3) 申请并建立董事会。", href: "/business/nonprofit" },
        { title: "EB-5 投资者信息", description: "了解 EB-5 要求、资格与材料准备。", href: "/business/eb5" },
        { title: "商业机会", description: "浏览或发布寻找投资人、合伙人或买家的商业机会。", href: "/business/marketplace" },
        { title: "税务设置中心", description: "EIN 指导、税务分类、薪资设置与税务专业交接。", href: "/business/tax-setup" },
      ],
      getStarted: "开始",
      helpTitle: "需要专业帮助吗？",
      helpDescription: "在任何阶段都可连接律师、认证代表、税务专业人士或商业支持团队。",
      hireHelp: "寻找帮助",
      disclaimer:
        "D.O.M.E. 提供教育工具与文档整理服务，不提供法律、税务或投资建议。",
    },
  },
  de: {
    landing: {
      nav: { home: "Start", about: "Über uns", contact: "Kontakt", signIn: "Anmelden", findPath: "Meinen Weg finden" },
      contactMenu: {
        label: "Abteilung kontaktieren",
        departments: [
          { title: "Allgemeine Informationen", subtitle: "Info@domeai.org", to: "/contact?dept=info" },
          { title: "Technischer Support", subtitle: "Support@domeai.org", to: "/contact?dept=support" },
          { title: "Empfehlungen & Partnerschaften", subtitle: "Referral@domeai.org", to: "/contact?dept=referral" },
          { title: "Abrechnung & Abonnements", subtitle: "Billing@domeai.org", to: "/contact?dept=billing" },
          { title: "Spenden & Beiträge", subtitle: "Donation@domeai.org", to: "/contact?dept=donation" },
        ],
        contactForm: "Kontaktformular",
      },
      hero: {
        titleLine1: "Einwanderung vereinfachen",
        titleLine2: "Vorbereitung und Chancen",
        description:
          "D.O.M.E. bietet sichere digitale Tools, um Einwanderungsunterlagen zu organisieren, Wege zu prüfen und mit vertrauenswürdigen Fachleuten in Kontakt zu treten.",
        primaryCta: "Assessment starten",
        secondaryCta: "Zugang für Profis / Organisationen",
      },
      trustSignals: ["DOJ-akkreditierte Vertretung", "Sichere Dokumentverschlüsselung", "Vertrauenswürdige Plattform zur Einwanderungsvorbereitung"],
      portals: {
        heading: "Wer sind Sie?",
        subheading: "Wählen Sie Ihren Einstieg mit Tools, die zu Ihren Bedürfnissen passen.",
        items: [
          { title: "Klient", description: "Ich brauche Hilfe bei Einwanderung", cta: "Meine Reise starten", to: "/signup?role=client" },
          { title: "Rechtsprofi", description: "Einwanderungsanwälte und DOJ-akkreditierte Vertreter", cta: "Profi-Portal", to: "/signup?role=attorney" },
          { title: "Organisation", description: "Gemeinnützige und Community-Organisationen", cta: "Organisations-Portal", to: "/signup?role=organization" },
          { title: "Regierung", description: "Behörden und öffentliche Programme", cta: "Regierungs-Portal", to: "/signup?role=government" },
        ],
      },
      howItWorks: {
        heading: "So funktioniert D.O.M.E.",
        subheading: "Drei einfache Schritte für Ihren Einwanderungsweg.",
        steps: [
          { step: "1", title: "Einwanderungsweg entdecken", description: "Beantworten Sie einfache Fragen. Unsere Engine analysiert 26+ Wege." },
          { step: "2", title: "Dokumente vorbereiten", description: "Laden Sie alle erforderlichen Unterlagen hoch, organisieren und speichern Sie sie sicher." },
          { step: "3", title: "Sicher vorankommen", description: "Erhalten Sie einen klaren Fahrplan, vernetzen Sie sich mit Profis und verfolgen Sie Ihren Fortschritt." },
        ],
      },
      platformFeatures: {
        heading: "Plattformfunktionen",
        subheading: "Leistungsstarke Tools zur Vereinfachung jedes Schritts im Einwanderungsprozess.",
        items: [
          { title: "Einwanderungs-Pathway-Finder", description: "Finden Sie heraus, welche Visa-, Green-Card- oder Einbürgerungswege passen könnten." },
          { title: "Immigration Passport Profil", description: "Ihr vollständiges Profil — Identität, Verlauf und Dokumente — sicher an einem Ort." },
          { title: "Sicherer Dokumenten-Tresor", description: "Antragsunterlagen hochladen, organisieren und exportieren." },
          { title: "Sprachgestützte Formularhilfe", description: "Schritt-für-Schritt-Unterstützung beim Ausfüllen von Formularen mit KI-Stimme." },
          { title: "Case Readiness Score", description: "Sehen Sie vor der Einreichung, wie gut Ihr Fall vorbereitet ist." },
        ],
      },
      business: {
        badge: "Business-Tools",
        title: "Unternehmen in den USA gründen",
        description: "D.O.M.E. bietet geführte Workflows für Gründer und Einwanderer, die in den USA ein Unternehmen aufbauen möchten.",
        bullets: ["LLC-Gründungsleitfaden", "Nonprofit-Gründung", "Investoren-Marktplatz"],
        cta: "Business Launch Center",
      },
      government: {
        badge: "Institutionell",
        title: "Regierungs- und Institutionsprogramme",
        description: "D.O.M.E. unterstützt Behörden, Nonprofit-Programme und Integrationsinitiativen mit Dashboards und Reporting.",
        bullets: ["Programm-Dashboards & Analysen", "Teilnehmerverwaltung", "Förderfähiges Reporting (PDF/CSV)"],
        cta: "Partnerschaften ansehen",
      },
      security: {
        heading: "Ihre Sicherheit hat Priorität",
        subheading: "Von Grund auf entwickelt, um Ihre sensibelsten Daten zu schützen.",
        items: [
          { title: "Verschlüsselte Dokumentenspeicherung", description: "Alle Dateien sind im Ruhezustand und bei Übertragung verschlüsselt." },
          { title: "Sichere Authentifizierung", description: "Mehrfaktor-Authentifizierung und Sitzungsverwaltung schützen jedes Konto." },
          { title: "Rollenbasierte Berechtigungen", description: "Benutzer sehen nur, was sie benötigen. Strenge Zugriffskontrollen schützen Daten." },
          { title: "Datenschutz", description: "Ihre Daten werden nicht verkauft oder geteilt. Volle Einhaltung von Datenschutzvorgaben." },
        ],
      },
      finalCta: {
        title: "Starten Sie heute Ihre Einwanderungsreise",
        description: "Schließen Sie sich Personen und Fachleuten an, die ihre Einwanderungsreise mit D.O.M.E. organisieren.",
        primaryCta: "Assessment starten",
        secondaryCta: "Zugang für Profis / Organisationen",
        freeLine: "Kostenlos starten · Keine Kreditkarte erforderlich",
      },
      footer: {
        tagline: "D.O.M.E. — Digitales Onboarding für erleichterte Migration",
        links: {
          about: "Über uns",
          contact: "Kontakt",
          network: "Netzwerk",
          business: "Business Center",
          pricing: "Preise",
          partnerships: "Partnerschaften",
          terms: "AGB",
          privacy: "Datenschutz",
          security: "Sicherheit",
          platformPosition: "Plattformposition",
          signIn: "Anmelden",
        },
        disclaimer:
          "D.O.M.E. ist ein Tool zur Einwanderungsvorbereitung und bietet keine Rechtsberatung. Für rechtliche Beratung wenden Sie sich an einen lizenzierten Einwanderungsanwalt oder DOJ-akkreditierten Vertreter.",
      },
    },
    businessHome: {
      heroTitleLine1: "Business-, Nonprofit- &",
      heroTitleLine2: "Investorenzentrum",
      heroDescription:
        "Geführte Workflows zur Unternehmensgründung, Nonprofit-Start, EB-5-Investitionsmigration und zur Verbindung mit Geschäftschancen.",
      modules: [
        { title: "Business Launch Center", description: "Gründen Sie eine LLC, Corporation oder Einzelunternehmen in jedem US-Bundesstaat mit geführten Abläufen.", href: "/business/formation" },
        { title: "Nonprofit Launch Center", description: "Starten Sie eine Nonprofit-Organisation, bereiten Sie den 501(c)(3)-Status vor und bauen Sie Ihr Board auf.", href: "/business/nonprofit" },
        { title: "EB-5 Investoreninformationen", description: "Erfahren Sie mehr über EB-5-Anforderungen und Dokumentenvorbereitung.", href: "/business/eb5" },
        { title: "Geschäftsmöglichkeiten", description: "Durchsuchen oder veröffentlichen Sie Chancen für Investoren, Partner oder Käufer.", href: "/business/marketplace" },
        { title: "Steuer-Setup-Center", description: "EIN-Leitfaden, Steuerklassifikation, Payroll-Setup und Übergabe an Steuerprofis.", href: "/business/tax-setup" },
      ],
      getStarted: "Loslegen",
      helpTitle: "Benötigen Sie professionelle Hilfe?",
      helpDescription: "Verbinden Sie sich jederzeit mit Anwälten, akkreditierten Vertretern, Steuerprofis oder Business-Support-Teams.",
      hireHelp: "Hilfe finden",
      disclaimer:
        "D.O.M.E. bietet Bildungswerkzeuge und Dokumentenorganisation. D.O.M.E. bietet keine Rechts-, Steuer- oder Anlageberatung.",
    },
  },
};

export const getSiteTranslations = (locale: Locale): SiteTranslationCopy => {
  return siteTranslations[locale] ?? siteTranslations.en;
};
