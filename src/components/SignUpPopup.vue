<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5">Create Account</v-card-title>

    <v-text-field label="Email" v-model="email" class="mt-4" />
    <v-text-field label="Username" v-model="username" class="mt-2" />
    <v-text-field label="Password" v-model="password" type="password" class="mt-2" />

    <v-btn @click="signUp" color="primary" class="mt-4">Sign Up</v-btn>
    <v-btn text @click="$emit('close')" class="mt-2">Cancel</v-btn>

    <v-alert v-if="errorMessage" type="error" class="mt-4">
      {{ errorMessage }}
    </v-alert>

    <v-snackbar v-model="showToast" color="success" timeout="4000">
      Welcome, {{ username }}! You’ve been added to the calendar 🎉
    </v-snackbar>
  </v-card>
</template>

<script>
import { supabase } from '../supabase';

export default {
  name: 'SignUpPopup',
  data() {
    return {
      email: '',
      username: '',
      password: '',
      errorMessage: '',
      showToast: false
    };
  },
  methods: {
    async signUp() {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase.auth.signUp({
        email: this.email,
        password: this.password
      });

      if (error) {
        this.errorMessage = error.message;
        return;
      }

      const userId = data.user.id;

      const { error: insertProfileError } = await supabase.from('profiles').insert({
        id: userId,
        email: this.email,
        username: this.username,
        timezone
      });

      if (insertProfileError) {
        this.errorMessage = insertProfileError.message;
        return;
      }

      // Insert default calendar rows
      const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const calendarRows = defaultDays.map(day => ({
  user_id: userId,
  username: this.username,
  day,
  start_time: '00:00',
  end_time: '00:00'
}));

      const { error: calendarError } = await supabase.from('availability').insert(calendarRows);

      if (calendarError) {
        this.errorMessage = calendarError.message;
        return;
      }

      this.showToast = true;
      setTimeout(() => this.$emit('signed-up'), 1000); // Let the toast show briefly
    }
  }
};
</script>
