export interface User {
  user_id: string;
  uap_id: string;
  full_name: string;
  phone_number: string;
  is_donor: boolean;
}

export interface DonorDetails {
  donor_id: string;
  user_id: string;
  blood_group: string;
  last_donation_date: string;
  department: string;
  batch_name: string;
  city_area: string;
}

const USERS_KEY = 'bloodbank_users';
const DONORS_KEY = 'bloodbank_donors';
const CURRENT_USER_KEY = 'bloodbank_current_user';

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

  searchDonors: (bloodGroup: string): Array<DonorDetails & { user: User }> => {
    const donors = donorService.getAllDonors();
    const users = authService.getAllUsers();
    
    const filteredDonors = donors.filter(d => d.blood_group === bloodGroup);
    
    return filteredDonors.map(donor => {
      const user = users.find(u => u.user_id === donor.user_id);
      const { password: _, ...userWithoutPassword } = user!;
      return { ...donor, user: userWithoutPassword };
    }).filter(d => d.user); // Only return donors with valid user accounts
  },

  getAllDonors: (): DonorDetails[] => {
    const donorsStr = localStorage.getItem(DONORS_KEY);
    return donorsStr ? JSON.parse(donorsStr) : [];
  }
};
