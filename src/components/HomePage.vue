<template>
  <v-container class="home-wrapper">
    <v-row justify="center" align="center">
      <v-col cols="12" md="8" class="text-center">
        <div class="hero-box">
          <h1 class="hero-title">Welcome to <span class="milk">MilkSync</span></h1>
          <p class="hero-subtitle">
            I have slaved away at this for too long...
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row justify="center" class="avatar-row">
      <v-col cols="12" md="10">
        <h2 class="avatar-title">Users</h2>
        <div class="avatar-grid">
          <div
            v-for="user in allUsernames"
            :key="user.id"
            class="avatar-wrapper"
            :title="user.username"
          >
            <img
              :src="user.avatar_url?.trim() || defaultAvatarUrl"
              :alt="user.username"
              class="avatar"
            />
            <div class="avatar-label">{{ user.username }}</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>



<script>
import { supabase } from '../supabase';

export default {
  name: 'HomePage',
  data() {
    return {
      allUsernames: [],
      defaultAvatarUrl: '', // will be set in mounted()
    };
  },
  async mounted() {
    // Fetch all user profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url');

    if (error) {
      console.error('Failed to fetch user avatars:', error.message);
    } else {
      this.allUsernames = users;
    }

    // Generate public URL for default avatar
    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl('default-avatar.jpg');

    this.defaultAvatarUrl = publicUrlData?.publicUrl || '';
  }
};
</script>



<style scoped>
.home-wrapper {
  padding-top: 48px;
  background-color: #0f172a; /* Deep blue night mode */
  min-height: 100vh;
  color: #cdd9f5;
}

.hero-box {
  background-color: #1a1e2b; /* Soft container tone */
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  margin-bottom: 32px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #90caf9;
}

.hero-title .milk {
  color: #cdd9f5;
  font-style: italic;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-top: 12px;
  margin-bottom: 24px;
  color: #aabbdc;
}

.avatar-row {
  margin-top: 24px;
}

.avatar-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #cdd9f5;
  margin-bottom: 16px;
  text-align: center;
}


.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.avatar-wrapper {
  width: 140px;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #2f2925;
  border-radius: 16px; /* Rounded square */
  padding: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.avatar {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px; /* Rounded square */
  margin-bottom: 6px;
}


.avatar-label {
  font-size: 1rem;
  color: #f5e6d8;
  text-align: center;
}
</style>
