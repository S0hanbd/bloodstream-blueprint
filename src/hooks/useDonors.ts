import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { donorService, type DonorDetails, type User } from "@/lib/auth";
import { calculateDonationEligibility } from "@/logic/cooldown";

export interface DonorWithUser extends DonorDetails {
  user: User;
  isAvailable: boolean;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
  blood_type: string | null;
  last_donation_date: string | null;
  phone: string | null;
  national_id: string | null;
}

export function useDonors(filters?: { bloodGroup?: string; searchQuery?: string }) {
  const bloodGroup = filters?.bloodGroup || "ALL";
  const searchQuery = filters?.searchQuery || "";

  return useQuery<DonorWithUser[]>({
    queryKey: ["donors", bloodGroup, searchQuery],
    queryFn: async () => {
      // If Supabase is configured, fetch profiles directly from database
      if (isSupabaseConfigured && supabase) {
        let query = supabase.from("profiles").select("*");

        if (bloodGroup && bloodGroup !== "ALL") {
          query = query.eq("blood_type", bloodGroup);
        }

        const { data: profiles, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        if (profiles && profiles.length > 0) {
          // Filter out profiles with null blood_type (hidden or unregistered profiles)
          let results: DonorWithUser[] = (profiles as ProfileRecord[])
            .filter((p) => p.blood_type !== null && p.blood_type !== "hidden")
            .map((p: ProfileRecord) => {
              const lastDonation = p.last_donation_date || "";
              const isAvailable = calculateDonationEligibility(lastDonation).isEligible;

              return {
                donor_id: p.id,
                user_id: p.id,
                blood_group: p.blood_type || "A+",
                last_donation_date: lastDonation,
                department: "General",
                batch_name: "Active",
                city_area: "Dhaka",
                total_donations: 0,
                user: {
                  user_id: p.id,
                  uap_id: p.national_id || p.id.substring(0, 8),
                  full_name: p.full_name || "Anonymous Donor",
                  phone_number: p.phone || "N/A",
                  is_donor: true,
                  account_status: "active",
                },
                isAvailable,
              };
            });

          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            results = results.filter(
              (d) =>
                d.user.full_name.toLowerCase().includes(q) ||
                d.user.uap_id.toLowerCase().includes(q) ||
                d.department.toLowerCase().includes(q) ||
                d.city_area.toLowerCase().includes(q)
            );
          }

          return results;
        }
      }

      // Fallback/sync source from donorService
      return donorService.searchDonors(bloodGroup, searchQuery);
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUpdateDonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Omit<DonorDetails, "donor_id" | "user_id">> }) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({
            blood_type: updates.blood_group,
            last_donation_date: updates.last_donation_date ? new Date(updates.last_donation_date).toISOString() : null,
          })
          .eq("id", userId);

        if (error) {
          throw new Error(error.message);
        }
      }

      // Local fallback sync
      return donorService.updateDonor(userId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}

export function useRegisterDonor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (donorData: Omit<DonorDetails, "donor_id">) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({
            blood_type: donorData.blood_group,
            last_donation_date: donorData.last_donation_date ? new Date(donorData.last_donation_date).toISOString() : null,
          })
          .eq("id", donorData.user_id);

        if (error) {
          throw new Error(error.message);
        }
      }

      try {
        return donorService.registerDonor(donorData);
      } catch {
        return donorService.updateDonor(donorData.user_id, donorData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}

export function useRecordDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, location }: { userId: string; location?: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { error: donationError } = await supabase.from("donations").insert({
          donor_id: userId,
          donation_date: new Date().toISOString(),
          location: location || "UAP Blood Bank Center",
          status: "completed",
        });

        if (donationError) {
          throw new Error(donationError.message);
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            last_donation_date: new Date().toISOString(),
          })
          .eq("id", userId);

        if (profileError) {
          throw new Error(profileError.message);
        }
      }

      return donorService.markAsDonated(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}

export function useHideProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ blood_type: "hidden" })
          .eq("id", userId);

        if (error) {
          throw new Error(error.message);
        }
      }
      return donorService.updateUser(userId, { account_status: "hidden" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}

export function useShowProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, bloodGroup }: { userId: string; bloodGroup: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .update({ blood_type: bloodGroup || "A+" })
          .eq("id", userId);

        if (error) {
          throw new Error(error.message);
        }
      }
      return donorService.updateUser(userId, { account_status: "active" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (error) {
          throw new Error(error.message);
        }
      }
      return donorService.updateUser(userId, { account_status: "deleted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donors"] });
    },
  });
}
