export interface Author {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarPatternSeed: string;
  specialty: string;
  role?: 'author' | 'editor' | 'reviewer';
  socialLinks?: {
    twitter?: string;
    github?: string;
    email?: string;
  };
  avatarUrl?: string;
}

export const AUTHORS: Record<string, Author> = {
  "jd_doe": {
    id: "jd_doe",
    name: "Dr. Julian Dehn",
    title: "Senior Control Scientist",
    bio: "Specializes in mathematical optimal control, recursive state estimators, and active vibration damping systems.",
    avatarPatternSeed: "jd_doe",
    specialty: "Control Systems",
    role: "author",
    socialLinks: {
      twitter: "jdehn_optimal",
      github: "jdehn-control",
      email: "jdehn@nexus-thought.org"
    }
  },
  "am_turing": {
    id: "am_turing",
    name: "Prof. Arthur M. Turing",
    title: "Deep Learning Architect",
    bio: "Focuses on neural attention mechanisms, high-dimensional vector spaces, and transformer optimization schemes.",
    avatarPatternSeed: "am_turing",
    specialty: "Machine Learning",
    role: "author",
    socialLinks: {
      twitter: "aturing_deep",
      github: "am-turing-architect",
      email: "aturing@nexus-thought.org"
    }
  },
  "c_shannon": {
    id: "c_shannon",
    name: "Dr. Claude Shannon",
    title: "Information Theorist & Analyst",
    bio: "Researches singular value decomposition, signal representations, and vector noise transformations.",
    avatarPatternSeed: "c_shannon",
    specialty: "Mathematical Physics",
    role: "author",
    socialLinks: {
      twitter: "cshannon_entropy",
      github: "c-shannon",
      email: "cshannon@nexus-thought.org"
    }
  },
  "l_euler": {
    id: "l_euler",
    name: "Dr. Leonhard Euler",
    title: "Chief Topology Editor",
    bio: "Supervises mathematical structural logic, high-dimensional manifolds, and graph connectivity optimization.",
    avatarPatternSeed: "l_euler",
    specialty: "Graph Theory",
    role: "editor",
    socialLinks: {
      twitter: "leuler_graphs",
      github: "leuler-topology",
      email: "leuler@nexus-thought.org"
    }
  },
  "h_poincare": {
    id: "h_poincare",
    name: "Prof. Henri Poincaré",
    title: "Peer Review Chair",
    bio: "Coordinates verification of non-linear differential dynamics, stability metrics, and orbits constraints.",
    avatarPatternSeed: "h_poincare",
    specialty: "Dynamical Systems",
    role: "reviewer",
    socialLinks: {
      twitter: "poincare_chaos",
      github: "hpoincare-systems",
      email: "hpoincare@nexus-thought.org"
    }
  }
};

