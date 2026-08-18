import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  profile_photo_url?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  async sendSignupOTP(email: string) {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email, purpose: 'signup' }
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de l\'envoi du code');
    }

    return data;
  }

  async completeSignup(email: string, password: string, username: string, fullName: string, code: string) {
    const { data, error } = await supabase.functions.invoke('complete-signup', {
      body: { email, password, username, fullName, code }
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de la création du compte');
    }

    if (data.user) {
      // Sign in the user after signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error after signup:', signInError);
        // Return user anyway, they can sign in manually
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          fullName: data.user.fullName,
        }
      };
    }

    throw new Error('Erreur lors de la création du compte');
  }

  async resendOTP(email: string) {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email, purpose: 'signup' }
    });

    if (error) {
      throw new Error(error.message || 'Échec de renvoi du code');
    }

    return { success: true };
  }

  async sendLoginOTP(email: string, password: string) {
    // First verify password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Sign out immediately - we just wanted to verify credentials
    await supabase.auth.signOut();

    // Now send OTP for login verification
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email, purpose: 'login' }
    });

    if (error) {
      throw new Error(error.message || 'Erreur lors de l\'envoi du code');
    }

    return data;
  }

  async verifyLoginOTPCode(email: string, code: string) {
    const { data, error } = await supabase.functions.invoke('complete-login', {
      body: { email, code }
    });

    if (error) {
      throw new Error(error.message || 'Code de vérification invalide');
    }

    return data;
  }

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw new Error(error.message || 'Impossible de se connecter avec Google');
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!profile) throw new Error('Profile not found');

    return {
      user: {
        id: profile.id,
        email: user.email,
        username: profile.username,
        fullName: profile.full_name,
        balance: parseFloat(profile.balance),
        profilePhotoUrl: profile.profile_photo_url,
        createdAt: profile.created_at,
        country: profile.country,
        language: profile.language,
        theme: profile.theme,
        notifications_enabled: profile.notifications_enabled,
        two_factor_enabled: profile.two_factor_enabled,
        withdrawal_method: profile.withdrawal_method,
        stripe_verified: profile.stripe_verified,
        numeric_user_id: profile.numeric_user_id,
      }
    };
  }

  async updateUserProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const profileUpdates: any = {};
    if (updates.username) profileUpdates.username = updates.username;
    if (updates.fullName) profileUpdates.full_name = updates.fullName;
    if (updates.profilePhotoUrl !== undefined) profileUpdates.profile_photo_url = updates.profilePhotoUrl;
    if (updates.balance !== undefined) profileUpdates.balance = updates.balance;
    if (updates.notifications_enabled !== undefined) profileUpdates.notifications_enabled = updates.notifications_enabled;
    if (updates.country !== undefined) profileUpdates.country = updates.country;
    if (updates.language !== undefined) profileUpdates.language = updates.language;
    if (updates.theme !== undefined) profileUpdates.theme = updates.theme;

    const { error } = await supabase
      .from('user_profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (error) throw error;

    return this.getUserProfile();
  }

  async deleteAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting auth user (requires admin privileges):', authError);
    }

    await this.signOut();
  }

  async createStripeAccount(email: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('stripe-connect', {
      body: { email, userId: user.id }
    });

    if (error) throw error;
    return data;
  }

  async createOnboardingLink(accountId: string, refreshUrl: string, returnUrl: string) {
    const { data, error } = await supabase.functions.invoke('stripe-connect', {
      body: { accountId, refreshUrl, returnUrl }
    });

    if (error) throw error;
    return data;
  }

  async getStripeAccount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: account, error } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return {
      account: account ? {
        stripeAccountId: account.stripe_account_id,
        status: account.status,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      } : null
    };
  }

  async createPayout(amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('balance')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) throw new Error('Profile not found');

    const { data, error } = await supabase.functions.invoke('stripe-payout', {
      body: { amount, userId: user.id }
    });

    if (error) throw error;

    const newBalance = parseFloat(profile.balance) - amount;
    return {
      success: true,
      transferId: data.transferId,
      newBalance: newBalance,
    };
  }

  async createTransaction(transaction: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: transaction.type,
        balance_change: transaction.balanceChange,
        description: transaction.description,
      });

    if (error) throw error;
    return { transaction };
  }

  async likeVideo(video: {
    videoId: number;
    videoUrl: string;
    videoUser: string;
    videoUserId: number;
    videoUserImageUrl: string;
    videoLikes: number;
    category?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('liked_videos')
      .insert({
        user_id: user.id,
        video_id: video.videoId,
        video_url: video.videoUrl,
        video_user: video.videoUser,
        video_user_id: video.videoUserId,
        video_user_image_url: video.videoUserImageUrl,
        video_likes: video.videoLikes,
        category: video.category || null,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: true, alreadyLiked: true };
      }
      throw error;
    }
    return { success: true, alreadyLiked: false };
  }

  async unlikeVideo(videoId: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('liked_videos')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    if (error) throw error;
    return { success: true };
  }

  async getLikedVideos() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: likedVideos, error } = await supabase
      .from('liked_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      likedVideos: (likedVideos || []).map(v => ({
        id: v.video_id,
        videos: { medium: { url: v.video_url } },
        user: v.video_user,
        user_id: v.video_user_id,
        userImageURL: v.video_user_image_url,
        likes: v.video_likes,
        likedAt: v.created_at,
      }))
    };
  }

  async getLikedVideoIds() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { videoIds: [] as number[] };

    const { data, error } = await supabase
      .from('liked_videos')
      .select('video_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return { videoIds: (data || []).map(v => v.video_id) };
  }

  async getComments(videoId: number) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        created_at,
        user_id,
        user_profiles!inner(username, full_name, profile_photo_url)
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { comments: data || [] };
  }

  async addComment(videoId: number, text: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        video_id: videoId,
        user_id: user.id,
        text,
      })
      .select(`
        id,
        text,
        created_at,
        user_id,
        user_profiles!inner(username, full_name, profile_photo_url)
      `)
      .single();

    if (error) throw error;
    return { comment: data };
  }

  async deleteComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true };
  }

  async followCreator(creatorNumericId: number, creatorName: string, creatorImageUrl: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        creator_numeric_id: creatorNumericId,
        creator_name: creatorName,
        creator_image_url: creatorImageUrl,
      });

    if (error) throw error;
    return { success: true };
  }

  async unfollowCreator(creatorNumericId: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('creator_numeric_id', creatorNumericId);

    if (error) throw error;
    return { success: true };
  }

  async isFollowing(creatorNumericId: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isFollowing: false };

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('creator_numeric_id', creatorNumericId)
      .maybeSingle();

    if (error) throw error;
    return { isFollowing: !!data };
  }

  async isMutualFollow(creatorNumericId: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isMutual: false };

    // Check if current user follows the creator
    const { data: myFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('creator_numeric_id', creatorNumericId)
      .maybeSingle();

    if (!myFollow) return { isMutual: false };

    // Find the creator's Supabase profile by their numeric_id
    const { data: creatorProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('numeric_id', creatorNumericId)
      .maybeSingle();

    if (!creatorProfile) return { isMutual: false };

    // Get current user's numeric_id
    const { data: myProfile } = await supabase
      .from('user_profiles')
      .select('numeric_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!myProfile?.numeric_id) return { isMutual: false };

    // Check if the creator follows us back
    const { data: reverseFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', creatorProfile.id)
      .eq('creator_numeric_id', myProfile.numeric_id)
      .maybeSingle();

    return { isMutual: !!reverseFollow };
  }
}

export const apiClient = new ApiClient();