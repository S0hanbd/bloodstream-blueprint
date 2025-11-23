export interface User {
  user_id: string;
  uap_id: string;
  full_name: string;
  phone_number: string;
  is_donor: boolean;
  account_status: 'active' | 'hidden' | 'deleted';
}

export interface DonorDetails {
  donor_id: string;
  user_id: string;
  blood_group: string;
  last_donation_date: string;
  department: string;
  batch_name: string;
  city_area: string;
  total_donations: number;
}

export interface Confirmation {
  confirmation_id: string;
  confirmer_user_id: string;
  donor_user_id: string;
  confirmation_date: string;
}

const USERS_KEY = 'bloodbank_users';
const DONORS_KEY = 'bloodbank_donors';
const CURRENT_USER_KEY = 'bloodbank_current_user';
const CONFIRMATIONS_KEY = 'bloodbank_confirmations';

export const authService = {
  register: (userData: Omit<User, 'user_id'> & { password: string }) => {
    const users = authService.getAllUsers();
    
    // Check if UAP ID already exists
    if (users.some(u => u.uap_id === userData.uap_id)) {
      throw new Error('UAP ID already registered');
    }

    const newUser: User & { password: string } = {
      user_id: crypto.randomUUID(),
      uap_id: userData.uap_id,
      full_name: userData.full_name,
      phone_number: userData.phone_number,
      is_donor: userData.is_donor,
      account_status: 'active',
      password: userData.password // In real app, this would be hashed
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { user_id: newUser.user_id, uap_id: newUser.uap_id, full_name: newUser.full_name };
  },

  login: (uap_id: string, password: string) => {
    const users = authService.getAllUsers();
    const user = users.find(u => u.uap_id === uap_id && u.password === password);
    
    if (!user) {
      throw new Error('Invalid UAP ID or password');
    }

    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    return userWithoutPassword;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  getAllUsers: (): Array<User & { password: string }> => {
    const usersStr = localStorage.getItem(USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const users = authService.getAllUsers();
    const userIndex = users.findIndex(u => u.user_id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Update current user if it's the same user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.user_id === userId) {
      const { password: _, ...userWithoutPassword } = users[userIndex];
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    }
  }
};

export const donorService = {
  registerDonor: (donorData: Omit<DonorDetails, 'donor_id'>) => {
    const donors = donorService.getAllDonors();
    
    // Check if user is already a donor
    if (donors.some(d => d.user_id === donorData.user_id)) {
      throw new Error('User is already registered as a donor');
    }

    const newDonor: DonorDetails = {
      donor_id: crypto.randomUUID(),
      total_donations: 0,
      ...donorData
    };

    donors.push(newDonor);
    localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
    
    // Update user's is_donor status
    authService.updateUser(donorData.user_id, { is_donor: true });
    
    return newDonor;
  },

  updateDonor: (userId: string, updates: Partial<Omit<DonorDetails, 'donor_id' | 'user_id'>>) => {
    const donors = donorService.getAllDonors();
    const donorIndex = donors.findIndex(d => d.user_id === userId);
    
    if (donorIndex === -1) {
      throw new Error('Donor not found');
    }

    donors[donorIndex] = { ...donors[donorIndex], ...updates };
    localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
    
    return donors[donorIndex];
  },

  getDonorByUserId: (userId: string): DonorDetails | null => {
    const donors = donorService.getAllDonors();
    return donors.find(d => d.user_id === userId) || null;
  },

  searchDonors: (bloodGroup: string): Array<DonorDetails & { user: User; isAvailable: boolean }> => {
    const donors = donorService.getAllDonors();
    const users = authService.getAllUsers();
    
    const filteredDonors = donors.filter(d => d.blood_group === bloodGroup);
    
    const results = filteredDonors.map(donor => {
      const user = users.find(u => u.user_id === donor.user_id);
      if (!user || user.account_status !== 'active') return null;
      
      const { password: _, ...userWithoutPassword } = user;
      const isAvailable = donorService.isDonorAvailable(donor);
      return { ...donor, user: userWithoutPassword, isAvailable };
    }).filter(d => d !== null) as Array<DonorDetails & { user: User; isAvailable: boolean }>;
    
    // Sort by last donation date (most recent first)
    return results.sort((a, b) => {
      const dateA = new Date(a.last_donation_date).getTime();
      const dateB = new Date(b.last_donation_date).getTime();
      return dateB - dateA;
    });
  },

  isDonorAvailable: (donor: DonorDetails): boolean => {
    const lastDonationDate = new Date(donor.last_donation_date);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastDonation >= 105; // 3.5 months = ~105 days
  },

  markAsDonated: (userId: string) => {
    const donors = donorService.getAllDonors();
    const donorIndex = donors.findIndex(d => d.user_id === userId);
    
    if (donorIndex === -1) {
      throw new Error('Donor not found');
    }

    const today = new Date().toISOString().split('T')[0];
    donors[donorIndex].last_donation_date = today;
    donors[donorIndex].total_donations = (donors[donorIndex].total_donations || 0) + 1;
    localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
    
    return donors[donorIndex];
  },

  getAllDonors: (): DonorDetails[] => {
    const donorsStr = localStorage.getItem(DONORS_KEY);
    return donorsStr ? JSON.parse(donorsStr) : [];
  }
};

export const confirmationService = {
  confirmDonor: (confirmerUserId: string, donorUserId: string) => {
    const confirmations = confirmationService.getAllConfirmations();
    
    // Check if user already confirmed this donor today
    const today = new Date().toISOString().split('T')[0];
    const todayConfirmations = confirmations.filter(
      c => c.confirmer_user_id === confirmerUserId && c.confirmation_date === today
    );
    
    if (todayConfirmations.length >= 2) {
      throw new Error('You can only confirm up to 2 donors per day');
    }
    
    // Check if already confirmed
    const existing = confirmations.find(
      c => c.confirmer_user_id === confirmerUserId && 
           c.donor_user_id === donorUserId && 
           c.confirmation_date === today
    );
    
    if (existing) {
      throw new Error('You already confirmed this donor today');
    }

    const newConfirmation: Confirmation = {
      confirmation_id: crypto.randomUUID(),
      confirmer_user_id: confirmerUserId,
      donor_user_id: donorUserId,
      confirmation_date: today
    };

    confirmations.push(newConfirmation);
    localStorage.setItem(CONFIRMATIONS_KEY, JSON.stringify(confirmations));
    
    return newConfirmation;
  },

  getConfirmationsForDonor: (donorUserId: string): Confirmation[] => {
    const confirmations = confirmationService.getAllConfirmations();
    const today = new Date().toISOString().split('T')[0];
    return confirmations.filter(
      c => c.donor_user_id === donorUserId && c.confirmation_date === today
    );
  },

  getAllConfirmations: (): Confirmation[] => {
    const confirmationsStr = localStorage.getItem(CONFIRMATIONS_KEY);
    return confirmationsStr ? JSON.parse(confirmationsStr) : [];
  }
};

export const statisticsService = {
  getStatistics: () => {
    const donors = donorService.getAllDonors();
    const users = authService.getAllUsers().filter(u => u.account_status === 'active');
    const activeDonors = donors.filter(d => {
      const user = users.find(u => u.user_id === d.user_id);
      return user && user.account_status === 'active';
    });
    
    const totalBags = donors.reduce((sum, donor) => sum + (donor.total_donations || 0), 0);
    
    return {
      totalBags,
      totalUsers: users.length,
      totalDonors: activeDonors.length
    };
  }
};
