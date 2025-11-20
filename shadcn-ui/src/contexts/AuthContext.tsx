import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  dob: string;
  voterId: string;
  hasVoted: boolean;
  votedFor: string | null;
}

interface Participant {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
}

interface VotingStatus {
  isActive: boolean;
  startDate: string;
  endDate: string | null;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  users: User[];
  participants: Participant[];
  votingStatus: VotingStatus;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'hasVoted' | 'votedFor'>) => Promise<boolean>;
  logout: () => void;
  vote: (participantId: string) => boolean;
  addParticipant: (participant: Omit<Participant, 'id' | 'votes'>) => void;
  updateParticipant: (id: string, participant: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  toggleVoting: () => void;
  resetPassword: (email: string, newPassword: string) => boolean;
  getResults: () => Participant[];
  loginStart: (email: string, password: string) => Promise<string | null>;
  loginVerify: (challengeId: string, code: string) => Promise<boolean>;
  resetPasswordStart: (email: string) => Promise<string | null>;
  resetPasswordVerify: (challengeId: string, code: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {

  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: '1',
    name: 'Candidate A',
    description:
      'Experienced leader with 10 years in public service. Focuses on education and healthcare reform.',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    votes: 0,
  },
  {
    id: '2',
    name: 'Candidate B',
    description:
      'Young innovator committed to technology and environmental sustainability initiatives.',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
    votes: 0,
  },
  {
    id: '3',
    name: 'Candidate C',
    description:
      'Business professional with expertise in economic development and job creation.',
    image:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    votes: 0,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({
    isActive: true,
    startDate: new Date().toISOString(),
    endDate: null,
  });

  useEffect(() => {
    const storedUsers = localStorage.getItem('voting_users');
    const storedParticipants = localStorage.getItem('voting_participants');
    const storedVotingStatus = localStorage.getItem('voting_status');
    const storedCurrentUser = localStorage.getItem('voting_current_user');
    const storedIsAdmin = localStorage.getItem('voting_is_admin');

    if (storedUsers) setUsers(JSON.parse(storedUsers));
    if (storedParticipants) {
      setParticipants(JSON.parse(storedParticipants));
    } else {
      setParticipants(INITIAL_PARTICIPANTS);
      localStorage.setItem('voting_participants', JSON.stringify(INITIAL_PARTICIPANTS));
    }
    if (storedVotingStatus) setVotingStatus(JSON.parse(storedVotingStatus));
    if (storedCurrentUser) setUser(JSON.parse(storedCurrentUser));
    if (storedIsAdmin) setIsAdmin(JSON.parse(storedIsAdmin));

    const token = localStorage.getItem('voting_token');
    if (token) {
      api.me(token)
        .then((resp) => {
          const u = resp.user;
          if (u) {
            const mergedUser: User = {
              id:
                (u as { id?: string; _id?: string }).id ||
                (u as { id?: string; _id?: string })._id ||
                Date.now().toString(),
              name: u.name,
              email: u.email,
              password: '',
              dob: '',
              voterId: '',
              hasVoted: false,
              votedFor: null,
            };
            setUser(mergedUser);
            const isAdminRole = (u as { role?: string }).role === 'admin';
            setIsAdmin(isAdminRole);
            localStorage.setItem('voting_current_user', JSON.stringify(mergedUser));
            localStorage.setItem('voting_is_admin', JSON.stringify(isAdminRole));
          }
        })
        .catch(() => {
          // ignore token errors on load
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('voting_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('voting_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('voting_status', JSON.stringify(votingStatus));
  }, [votingStatus]);

  // Email+password login (non-OTP, kept for compatibility)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const resp = await api.startLogin(email, password).then(({ challengeId }) =>
        api.verifyLogin(challengeId, prompt('Enter the OTP code sent to your email') || '')
      );
      const u = resp.user;
      const mergedUser: User = {
        id:
          (u as { id?: string; _id?: string }).id ||
          (u as { id?: string; _id?: string })._id ||
          Date.now().toString(),
        name: u.name,
        email: u.email,
        password: '',
        dob: '',
        voterId: '',
        hasVoted: false,
        votedFor: null,
      };
      setUser(mergedUser);
      const isAdminRole = (u as { role?: string }).role === 'admin';
      setIsAdmin(isAdminRole);
      localStorage.setItem('voting_current_user', JSON.stringify(mergedUser));
      localStorage.setItem('voting_is_admin', JSON.stringify(isAdminRole));
      localStorage.setItem('voting_token', resp.token);
      return true;
    } catch {
      return false;
    }
  };

  // Admin login (non-OTP)
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const resp = await api.adminLogin(email, password);
      const u = resp.user;
      const mergedUser: User = {
        id:
          (u as { id?: string; _id?: string }).id ||
          (u as { id?: string; _id?: string })._id ||
          Date.now().toString(),
        name: u.name,
        email: u.email,
        password: '',
        dob: '',
        voterId: '',
        hasVoted: false,
        votedFor: null,
      };
      setUser(mergedUser);
      setIsAdmin(true);
      localStorage.setItem('voting_current_user', JSON.stringify(mergedUser));
      localStorage.setItem('voting_is_admin', JSON.stringify(true));
      localStorage.setItem('voting_token', resp.token);
      return true;
    } catch {
      return false;
    }
  };

  // User signup
  const signup = async (
    userData: Omit<User, 'id' | 'hasVoted' | 'votedFor'>
  ): Promise<boolean> => {
    try {
      const resp = await api.signup(userData.name, userData.email, userData.password);
      const u = resp.user;
      const mergedUser: User = {
        id:
          (u as { id?: string; _id?: string }).id ||
          (u as { id?: string; _id?: string })._id ||
          Date.now().toString(),
        name: u.name,
        email: u.email,
        password: '',
        dob: userData.dob || '',
        voterId: userData.voterId || '',
        hasVoted: false,
        votedFor: null,
      };
      setUsers((prev) => [...prev, mergedUser]);
      setUser(mergedUser);
      setIsAdmin(false);
      localStorage.setItem('voting_current_user', JSON.stringify(mergedUser));
      localStorage.setItem('voting_is_admin', JSON.stringify(false));
      localStorage.setItem('voting_token', resp.token);
      return true;
    } catch {
      return false;
    }
  };

  // OTP Login: start and verify
  const loginStart = async (email: string, password: string): Promise<string | null> => {
    try {
      const { challengeId } = await api.startLogin(email, password);
      return challengeId || null;
    } catch {
      return null;
    }
  };

  const loginVerify = async (challengeId: string, code: string): Promise<boolean> => {
    try {
      const resp = await api.verifyLogin(challengeId, code);
      const u = resp.user;
      const mergedUser: User = {
        id:
          (u as { id?: string; _id?: string }).id ||
          (u as { id?: string; _id?: string })._id ||
          Date.now().toString(),
        name: u.name,
        email: u.email,
        password: '',
        dob: '',
        voterId: '',
        hasVoted: false,
        votedFor: null,
      };
      setUser(mergedUser);
      const isAdminRole = (u as { role?: string }).role === 'admin';
      setIsAdmin(isAdminRole);
      localStorage.setItem('voting_current_user', JSON.stringify(mergedUser));
      localStorage.setItem('voting_is_admin', JSON.stringify(isAdminRole));
      localStorage.setItem('voting_token', resp.token);
      return true;
    } catch {
      return false;
    }
  };

  // Forgot Password via email OTP
  const resetPasswordStart = async (email: string): Promise<string | null> => {
    try {
      const { challengeId } = await api.passwordResetStart(email);
      return challengeId || null;
    } catch {
      return null;
    }
  };

  const resetPasswordVerify = async (
    challengeId: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const resp = await api.passwordResetVerify(challengeId, code, newPassword);
      return !!resp.ok;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('voting_current_user');
    localStorage.removeItem('voting_is_admin');
    localStorage.removeItem('voting_token');
  };

  const vote = (participantId: string): boolean => {
    if (!user || user.hasVoted || !votingStatus.isActive) return false;

    const updatedParticipants = participants.map((p) =>
      p.id === participantId ? { ...p, votes: p.votes + 1 } : p
    );

    const updatedUser = { ...user, hasVoted: true, votedFor: participantId };
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));

    setParticipants(updatedParticipants);
    setUser(updatedUser);
    setUsers(updatedUsers);
    localStorage.setItem('voting_current_user', JSON.stringify(updatedUser));

    return true;
  };

  const addParticipant = (participant: Omit<Participant, 'id' | 'votes'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: Date.now().toString(),
      votes: 0,
    };
    setParticipants([...participants, newParticipant]);
  };

  const updateParticipant = (id: string, updatedData: Partial<Participant>) => {
    setParticipants(participants.map((p) => (p.id === id ? { ...p, ...updatedData } : p)));
  };

  const deleteParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const toggleVoting = () => {
    setVotingStatus({
      ...votingStatus,
      isActive: !votingStatus.isActive,
      endDate: votingStatus.isActive ? new Date().toISOString() : null,
    });
  };

  // Legacy local-only reset (kept to avoid breaking existing UI paths)
  const resetPassword = (email: string, newPassword: string): boolean => {
    const userIndex = users.findIndex((u) => u.email === email);
    if (userIndex === -1) return false;

    const updatedUsers = [...users];
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
    setUsers(updatedUsers);
    return true;
  };

  const getResults = (): Participant[] => {
    return [...participants].sort((a, b) => b.votes - a.votes);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        users,
        participants,
        votingStatus,
        login, // kept for compatibility
        adminLogin,
        signup,
        logout,
        vote,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        toggleVoting,
        resetPassword, // legacy local
        getResults,
        loginStart,
        loginVerify,
        resetPasswordStart,
        resetPasswordVerify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};