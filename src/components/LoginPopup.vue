<template>
  <v-card class="pa-6">
    <v-card-title class="text-h5">Log In</v-card-title>

    <v-text-field label="Email" v-model="email" class="mt-4" />
    <v-text-field label="Password" v-model="password" type="password" class="mt-2" />

    <v-btn @click="logIn" color="primary" class="mt-4">Log In</v-btn>
    <v-btn text @click="$emit('close')" class="mt-2">Cancel</v-btn>

    <v-alert v-if="errorMessage" type="error" class="mt-4">
      {{ errorMessage }}
    </v-alert>
  </v-card>
</template>

<script>
import { supabase } from '../supabase';

export default {
  name: 'LoginPopup',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async logIn() {
      const { error } = await supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password
      });

      if (error) {
        this.errorMessage = error.message;
      } else {
        this.$emit('logged-in');
      }
    }
  }
};
</script>
