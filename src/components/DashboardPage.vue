<template>
  <v-container class="dashboard-container">
    <v-card class="dashboard-card">
      <div class="dashboard-flex">
        <!-- Left: Greeting + Avatar Box -->
        <div class="avatar-box">
          <div class="greeting-box">
            <h2 class="milk-heading">Hi, {{ profile.username }}! 👋</h2>
            <p class="milk-subtitle">Welcome back to your dashboard</p>
          </div>

          <div class="avatar-splash-wrapper">
            <img src="/milk-splash.svg" class="milk-splash" alt="Milk splash" />
            <v-card class="avatar-card">
              <v-avatar :size="200" class="avatar-wrapper">
                <img :src="avatarUrl || defaultAvatar" alt="User avatar" />
              </v-avatar>
              <v-btn class="change-avatar-btn" small @click="showAvatarDialog = true">
                Change Avatar
              </v-btn>
            </v-card>
          </div>
        </div>

        <!-- Right: Availability Box -->
        <div class="availability-box">
          <v-card class="availability-panel">
            <h3 class="section-title">Weekly Availability</h3>
            <div class="availability-header">
              <span>Day</span>
              <span>Time Range</span>
              <span>Available</span>
            </div>

            <div
              v-for="day in fullWeek"
              :key="day"
              class="availability-row"
            >
              <span class="day-label">{{ day }}</span>

              <div class="time-range">
                <v-row dense v-if="availabilityMap[day].available">
                  <v-col cols="6">
                    <v-text-field
                      v-model="availabilityMap[day].start"
                      type="time"
                      dense
                      hide-details
                      class="time-input"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="availabilityMap[day].end"
                      type="time"
                      dense
                      hide-details
                      class="time-input"
                    />
                  </v-col>
                </v-row>

                <div
                  v-if="availabilityMap[day].available && !availabilityMap[day].start && !availabilityMap[day].end"
                  class="tbd-badge"
                >
                  ⏳ TBD
                </div>

                <div v-else-if="!availabilityMap[day].available" class="unavailable-text">
                  Not available
                </div>
              </div>

              <div class="toggle-box">
                <v-switch
                  v-model="availabilityMap[day].available"
                  inset
                  color="success"
                  hide-details
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-row">
              <v-btn class="clear-btn" @click="clearWeek" small>Clear Week</v-btn>
              <v-btn class="save-btn" @click="saveAllAvailability" small>Save All</v-btn>
            </div>

            <!-- Save Notification -->
            <v-snackbar
              v-model="saveSnackbar"
              timeout="3000"
              location="bottom center"
              class="save-snackbar"
              style="background-color: transparent"
            >
              ✅ Availability saved!
            </v-snackbar>
          </v-card>
        </div>
      </div>

      <!-- Avatar Editor Modal -->
      <v-dialog v-model="showAvatarDialog" max-width="600px" scrollable>
        <v-card>
          <v-card-title class="text-h6">Update Your Avatar</v-card-title>
          <v-card-text>
            <AvatarEditor :userId="userId" @updated="handleAvatarUpdate" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click="showAvatarDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>











<script>
import { supabase } from '../supabase';
import AvatarEditor from '../components/AvatarEditor.vue';

export default {
  name: 'DashboardPage',
  components: { AvatarEditor },
  data() {
  return {
    profile: {},
    userId: null,
    avatarUrl: '',
    defaultAvatar: '', // will be set in mounted()
    showAvatarDialog: false,
    fullWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    userAvailability: [],
    availabilityMap: Object.fromEntries(
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => [
        day,
        { available: false, start: '', end: '' }
      ])
    ),
    saveSnackbar: false,
    userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
},

async mounted() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return this.$router.push('/');
  this.userId = user.id;

  // Load default avatar from Supabase Storage
  const { data: defaultAvatarData } = supabase.storage
    .from('avatars')
    .getPublicUrl('default-avatar.jpg');
  this.defaultAvatar = defaultAvatarData.publicUrl;

  // Update timezone and load profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ timezone: this.userTimeZone })
    .eq('id', this.userId)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to load profile:', error.message);
  } else {
    this.profile = { ...data, email: user.email };
    this.userTimeZone = data.timezone || this.userTimeZone;

    // Use default avatar if none is set
    this.avatarUrl = data.avatar_url?.trim()
      ? data.avatar_url
      : this.defaultAvatar;
  }

  await this.fetchAvailability();
}
,
  methods: {
    handleAvatarUpdate(newUrl) {
      this.avatarUrl = newUrl;
      this.showAvatarDialog = false;
    },
    clearWeek() {
      this.fullWeek.forEach(day => {
        this.availabilityMap[day] = { available: false, start: '', end: '' };
      });
    },
    convertToUtcTime(localTime) {
      try {
        const [hours, minutes] = localTime.split(':').map(Number);
        const localDate = new Date();
        localDate.setHours(hours, minutes, 0, 0);
        return localDate.toISOString().substring(11, 19);
      } catch (err) {
        console.warn('⚠️ UTC conversion failed:', err);
        return null;
      }
    },
    async fetchAvailability() {
      const { data: availability, error } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.error('❌ Failed to fetch availability:', error.message);
        return;
      }

      this.userAvailability = availability || [];

      this.fullWeek.forEach(day => {
        const entry = this.userAvailability.find(a => a.day === day);
        if (entry) {
          this.availabilityMap[day].available = entry.status === 'Available';

          if (entry.start_time && entry.end_time) {
            try {
              const today = new Date().toISOString().split('T')[0];
              const startDate = new Date(`${today}T${entry.start_time}Z`);
              const endDate = new Date(`${today}T${entry.end_time}Z`);

              this.availabilityMap[day].start = startDate.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                timeZone: this.userTimeZone
              });

              this.availabilityMap[day].end = endDate.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                timeZone: this.userTimeZone
              });
            } catch (err) {
              console.warn(`⚠️ Failed to format time for ${day}:`, err);
            }
          }
        }
      });
    },
    async saveAllAvailability() {
      for (const day of this.fullWeek) {
        const { available, start, end } = this.availabilityMap[day];
        const isValidTime = time => /^\d{2}:\d{2}$/.test(time);

        let status = 'Unavailable';
        let startTime = null;
        let endTime = null;

        if (available && isValidTime(start) && isValidTime(end)) {
          startTime = this.convertToUtcTime(start);
          endTime = this.convertToUtcTime(end);
          status = 'Available';
        }

        const existing = this.userAvailability.find(a => a.day === day);

        if (existing) {
          const { error } = await supabase
            .from('availability')
            .update({ start_time: startTime, end_time: endTime, status })
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Update failed for ${day}:`, error);
          }
        } else {
          const { data, error } = await supabase
            .from('availability')
            .insert([{
              user_id: this.userId,
              name: this.profile.username,
              day,
              start_time: startTime,
              end_time: endTime,
              status
            }]);

          if (error) {
            console.error(`❌ Insert failed for ${day}:`, error);
          } else {
            this.userAvailability.push(...data);
          }
        }
      }

      await this.fetchAvailability();
      this.saveSnackbar = true;
    }
  }
};
</script>










<style scoped>
.dashboard-container {
  padding: 2rem;
  background-color: #0f172a;
  font-family: 'Quicksand', sans-serif;
  color: #fff1e6;
}

/* Unified card */
.dashboard-card {
  background-color: #1e293b;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(255, 241, 230, 0.1);
}

/* Layout */
.dashboard-flex {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: flex-start;
}

/* Avatar Box */
.avatar-box {
  flex: 1.5;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
}

/* Greeting */
.greeting-box {
  margin-bottom: 1rem;
  text-align: center;
}

.milk-heading {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.milk-subtitle {
  font-size: 0.95rem;
  color: #cdb4db;
}

/* Avatar Splash Wrapper */
.avatar-splash-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.milk-splash {
  position: absolute;
  top: -30px;
  left: -30px;
  width: 300px;
  opacity: 0.4;
  z-index: 0;
}

/* Avatar Card */
.avatar-card {
  background-color: #334155;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 12px rgba(255, 241, 230, 0.1);
  z-index: 1;
}

.avatar-wrapper {
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #fff1e6;
  margin-bottom: 1.25rem;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.change-avatar-btn {
  background-color: #cdb4db;
  color: #121212;
  border-radius: 999px;
  font-weight: 600;
}

/* Availability Box */
.availability-box {
  flex: 2.5;
  max-width: none;
  min-width: 0;
}

.availability-panel {
  background-color: #1e293b;
  border: 2px solid #334155;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(255, 241, 230, 0.05);
}

/* Availability Header */
.section-title {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.availability-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  font-weight: 600;
  font-size: 0.75rem;
  color: #f5e1da;
  margin-bottom: 0.5rem;
}

/* Availability Rows */
.availability-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 241, 230, 0.05);
}

.day-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #f5e1da;
}

.time-range {
  margin-bottom: 4px;
}

.time-input {
  background-color: #334155;
  color: #fff1e6;
  border-radius: 8px;
  font-size: 0.85rem;
}

/* Status Text */
.tbd-badge {
  font-size: 0.75rem;
  font-style: italic;
  color: #ffd6a5;
}

.unavailable-text {
  font-size: 0.75rem;
  font-style: italic;
  color: #888;
}

.toggle-box {
  display: flex;
  justify-content: center;
}

/* Action Buttons */
.action-row {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.clear-btn {
  background-color: #ffd6a5;
  color: #121212;
  border-radius: 999px;
  font-weight: 600;
}

.save-btn {
  background-color: #a3c4f3;
  color: #121212;
  border-radius: 999px;
  font-weight: 600;
}

/* Snackbar */
.save-snackbar {
  background-color: #2e4d3f !important;
  color: #fff1e6 !important;
  font-size: 0.9rem;
  border-radius: 8px;
  max-width: 320px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(255, 241, 230, 0.2);
  padding: 12px 16px;
  text-align: center;
  animation: fadeIn 0.3s ease-out;
  z-index: 9999;
  position: relative;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
