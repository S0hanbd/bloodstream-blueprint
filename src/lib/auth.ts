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

export const INITIAL_USERS: Array<User & { password: string }> = [
  { user_id: "u14101095", uap_id: "14101095", full_name: "Tanvir Hasan", phone_number: "01711223344", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u24202074", uap_id: "24202074", full_name: "Arifur Rahman", phone_number: "01812345678", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u18101023", uap_id: "18101023", full_name: "Nusrat Jahan", phone_number: "01911998877", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u19201056", uap_id: "19201056", full_name: "Sumaiya Akter", phone_number: "01555667788", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u20101088", uap_id: "20101088", full_name: "Farhan Ahmed", phone_number: "01677889900", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u21101012", uap_id: "21101012", full_name: "Mahfuzur Rahman", phone_number: "01300112233", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u22101045", uap_id: "22101045", full_name: "Kazi Nazrul Islam", phone_number: "01722334455", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u23101067", uap_id: "23101067", full_name: "Tasmia Islam", phone_number: "01833445566", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u15101034", uap_id: "15101034", full_name: "Rakibul Hossain", phone_number: "01944556677", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u16201089", uap_id: "16201089", full_name: "Shahriar Kabir", phone_number: "01511224466", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u17101099", uap_id: "17101099", full_name: "Sadia Sultana", phone_number: "01622446688", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u18201011", uap_id: "18201011", full_name: "Imtiaz Mahmud", phone_number: "01733557799", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u19101077", uap_id: "19101077", full_name: "Fariha Chowdhury", phone_number: "01844668800", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u20201055", uap_id: "20201055", full_name: "Mehedi Hasan Shamim", phone_number: "01955779911", is_donor: true, account_status: "active", password: "password123" },
  { user_id: "u21201044", uap_id: "21201044", full_name: "Sabrina Yasmin", phone_number: "01311335577", is_donor: true, account_status: "active", password: "password123" }
];

export const INITIAL_DONORS: DonorDetails[] = [
  { donor_id: "d14101095", user_id: "u14101095", blood_group: "A+", last_donation_date: "2024-01-15", department: "Computer Science & Engineering", batch_name: "Fall 2021", city_area: "Dhanmondi, Dhaka", total_donations: 4 },
  { donor_id: "d24202074", user_id: "u24202074", blood_group: "B+", last_donation_date: "2023-11-20", department: "Electrical & Electronic Engineering", batch_name: "Spring 2022", city_area: "Mirpur 10, Dhaka", total_donations: 2 },
  { donor_id: "d18101023", user_id: "u18101023", blood_group: "O+", last_donation_date: "2024-03-01", department: "Pharmacy", batch_name: "Fall 2020", city_area: "Farmgate, Dhaka", total_donations: 5 },
  { donor_id: "d19201056", user_id: "u19201056", blood_group: "AB+", last_donation_date: "2023-09-10", department: "Business Administration", batch_name: "Spring 2021", city_area: "Mohammadpur, Dhaka", total_donations: 3 },
  { donor_id: "d20101088", user_id: "u20101088", blood_group: "O-", last_donation_date: "2023-12-05", department: "Civil Engineering", batch_name: "Fall 2022", city_area: "Uttara, Dhaka", total_donations: 1 },
  { donor_id: "d21101012", user_id: "u21101012", blood_group: "A-", last_donation_date: "2024-02-14", department: "Law & Human Rights", batch_name: "Spring 2023", city_area: "Green Road, Dhaka", total_donations: 2 },
  { donor_id: "d22101045", user_id: "u22101045", blood_group: "B-", last_donation_date: "2023-08-25", department: "English", batch_name: "Fall 2023", city_area: "Rajarbagh, Dhaka", total_donations: 3 },
  { donor_id: "d23101067", user_id: "u23101067", blood_group: "AB-", last_donation_date: "2024-04-10", department: "Pharmacy", batch_name: "Spring 2024", city_area: "Gulshan 1, Dhaka", total_donations: 1 },
  { donor_id: "d15101034", user_id: "u15101034", blood_group: "A+", last_donation_date: "2024-05-01", department: "Computer Science & Engineering", batch_name: "Fall 2019", city_area: "Lalmatia, Dhaka", total_donations: 6 },
  { donor_id: "d16201089", user_id: "u16201089", blood_group: "B+", last_donation_date: "2023-10-18", department: "Electrical & Electronic Engineering", batch_name: "Spring 2020", city_area: "Banani, Dhaka", total_donations: 4 },
  { donor_id: "d17101099", user_id: "u17101099", blood_group: "O+", last_donation_date: "2024-02-28", department: "Civil Engineering", batch_name: "Fall 2020", city_area: "Shyamoli, Dhaka", total_donations: 3 },
  { donor_id: "d18201011", user_id: "u18201011", blood_group: "A+", last_donation_date: "2023-07-12", department: "Business Administration", batch_name: "Spring 2021", city_area: "Badda, Dhaka", total_donations: 5 },
  { donor_id: "d19101077", user_id: "u19101077", blood_group: "B+", last_donation_date: "2024-01-30", department: "Architecture", batch_name: "Fall 2021", city_area: "Azimpur, Dhaka", total_donations: 2 },
  { donor_id: "d20201055", user_id: "u20201055", blood_group: "O+", last_donation_date: "2023-12-22", department: "Computer Science & Engineering", batch_name: "Spring 2022", city_area: "Tejgaon, Dhaka", total_donations: 3 },
  { donor_id: "d21201044", user_id: "u21201044", blood_group: "AB+", last_donation_date: "2024-03-15", department: "Law & Human Rights", batch_name: "Spring 2023", city_area: "Moghbazar, Dhaka", total_donations: 1 }
];

export const authService = {
  register: (userData: Omit<User, 'user_id'> & { password: string }) => {
    const users = authService.getAllUsers();
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
      password: userData.password
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Async sync to serverless API
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...userData })
    }).catch(() => {});
    
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

    // Async sync to serverless API
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', uap_id, password })
    }).catch(() => {});
    
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
    let users: Array<User & { password: string }> = [];
    if (usersStr) {
      try {
        users = JSON.parse(usersStr);
        if (!Array.isArray(users)) users = [];
      } catch {
        users = [];
      }
    }
    let modified = false;
    for (const iu of INITIAL_USERS) {
      if (!users.some(u => u.uap_id === iu.uap_id || u.user_id === iu.user_id)) {
        users.push(iu);
        modified = true;
      }
    }
    if (modified || !usersStr) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  },

  updateUser: (userId: string, updates: Partial<User>) => {
    const users = authService.getAllUsers();
    const userIndex = users.findIndex(u => u.user_id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

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
    authService.updateUser(donorData.user_id, { is_donor: true });

    fetch('/api/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    }).catch(() => {});
    
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

  searchDonors: (bloodGroup: string, queryText: string = ""): Array<DonorDetails & { user: User; isAvailable: boolean }> => {
    const donors = donorService.getAllDonors();
    const users = authService.getAllUsers();
    
    const filteredDonors = donors.filter(d => {
      if (bloodGroup && bloodGroup !== "ALL" && d.blood_group !== bloodGroup) {
        return false;
      }
      return true;
    });
    
    const results = filteredDonors.map(donor => {
      const user = users.find(u => u.user_id === donor.user_id);
      if (!user || user.account_status !== 'active') return null;
      
      const { password: _, ...userWithoutPassword } = user;

      if (queryText && queryText.trim()) {
        const q = queryText.toLowerCase().trim();
        const matchesName = user.full_name.toLowerCase().includes(q);
        const matchesId = user.uap_id.toLowerCase().includes(q);
        const matchesDept = donor.department.toLowerCase().includes(q);
        const matchesArea = donor.city_area.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesArea) {
          return null;
        }
      }

      const isAvailable = donorService.isDonorAvailable(donor);
      return { ...donor, user: userWithoutPassword, isAvailable };
    }).filter(d => d !== null) as Array<DonorDetails & { user: User; isAvailable: boolean }>;
    
    return results.sort((a, b) => {
      const dateA = new Date(a.last_donation_date).getTime();
      const dateB = new Date(b.last_donation_date).getTime();
      return dateB - dateA;
    });
  },

  isDonorAvailable: (donor: DonorDetails): boolean => {
    if (!donor.last_donation_date) return true;
    const lastDonationDate = new Date(donor.last_donation_date);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastDonation >= 105;
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
    let donors: DonorDetails[] = [];
    if (donorsStr) {
      try {
        donors = JSON.parse(donorsStr);
        if (!Array.isArray(donors)) donors = [];
      } catch {
        donors = [];
      }
    }
    let modified = false;
    for (const id of INITIAL_DONORS) {
      if (!donors.some(d => d.donor_id === id.donor_id)) {
        donors.push(id);
        modified = true;
      }
    }
    if (modified || !donorsStr) {
      localStorage.setItem(DONORS_KEY, JSON.stringify(donors));
    }
    return donors;
  }
};

export const confirmationService = {
  confirmDonor: (confirmerUserId: string, donorUserId: string) => {
    const confirmations = confirmationService.getAllConfirmations();
    
    const today = new Date().toISOString().split('T')[0];
    const todayConfirmations = confirmations.filter(
      c => c.confirmer_user_id === confirmerUserId && c.confirmation_date === today
    );
    
    if (todayConfirmations.length >= 2) {
      throw new Error('You can only confirm up to 2 donors per day');
    }
    
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

    fetch('/api/confirmations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmer_user_id: confirmerUserId, donor_user_id: donorUserId })
    }).catch(() => {});
    
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
