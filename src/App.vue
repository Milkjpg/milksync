<template>
  <div id="app" class="app-wrapper">
    <!-- Milk splash decorations -->
    <img src="/milk-splash.svg" alt="Milk splash" class="milk-splash splash-top-left" />
    <img src="/milk-splash.svg" alt="Milk splash" class="milk-splash splash-bottom-right" />

    <!-- Blob accents -->
    <div class="blob-layer">
      <img src="/=blob1.svg" class="blob blob1" alt="Blob 1" />
      <img src="/blob2.svg" class="blob blob2" alt="Blob 2" />
      <img src="/blob3.svg" class="blob blob3" alt="Blob 3" />
      <img src="/blob4.svg" class="blob blob4" alt="Blob 4" />
    </div>

    <header class="nav-bar">
      <nav>
        <button @click="goHome" class="nav-link">Home</button>
        <router-link to="/calendar" class="nav-link">Calendar</router-link>
        <router-link to="/games" class="nav-link">Games</router-link>

        <v-spacer />

        <template v-if="!isLoggedIn">
          <v-btn text @click="showLogin = true" class="nav-link">Log In</v-btn>
          <v-btn text @click="showSignup = true" class="nav-link">Sign Up</v-btn>
        </template>

        <button
          v-if="isLoggedIn"
          class="sign-out-button"
          @click="signOut"
        >
          Sign Out
        </button>
      </nav>

      <!-- Login Modal -->
      <v-dialog v-model="showLogin" max-width="400">
        <LoginPopup @close="showLogin = false" @logged-in="handleLogin" />
      </v-dialog>

      <!-- Signup Modal -->
      <v-dialog v-model="showSignup" max-width="400">
        <SignUpPopup @close="showSignup = false" @signed-up="handleLogin" />
      </v-dialog>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>



<script>
import { supabase } from './supabase';
import LoginPopup from './components/LoginPopup.vue';
import SignUpPopup from './components/SignUpPopup.vue';

export default {
  name: 'App',
  components: {
    LoginPopup,
    SignUpPopup
  },
  data() {
    return {
      isLoggedIn: false,
      showLogin: false,
      showSignup: false
    };
  },
  async mounted() {
    const { data: { user } } = await supabase.auth.getUser();
    this.isLoggedIn = !!user;

    if (user && this.$route.path !== '/dashboard') {
      this.$router.push('/dashboard');
    }
  },
  methods: {
    goHome() {
      if (this.isLoggedIn) {
        this.$router.push('/dashboard');
      } else {
        this.$router.push('/');
      }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        this.isLoggedIn = false;
        this.$router.push('/');
      } else {
        console.error('Sign out failed:', error.message);
      }
    },
    handleLogin() {
      this.isLoggedIn = true;
      this.showLogin = false;
      this.showSignup = false;
      this.$router.push('/dashboard');
    }
  }
};
</script>
<style scoped>
.app-wrapper {
  background-color: #0f172a;
  min-height: 100vh;
  font-family: 'Quicksand', sans-serif;
  color: #fff1e6;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
}

/* Milk splash decorations */
.milk-splash {
  position: absolute;
  width: 300px;
  height: 300px;
  opacity: 1.;
  pointer-events: none;
  z-index: 0;
}

.splash-top-left {
  top: -40px;
  left: -40px;
  opacity: 0.01
}

.splash-bottom-right {
  bottom: -40px;
  right: -40px;
  opacity: 0.01
}

/* Blob accents */
.blob-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  opacity: 0;
  transform-origin: center;
}

.blob1 {
  top: 10%;
  left: 5%;
  width: 120px;
  transform: rotate(15deg);
}

.blob2 {
  top: 70%;
  left: 12%;
  width: 100px;
  transform: rotate(-30deg);
}

.blob3 {
  top: 25%;
  right: 8%;
  width: 140px;
  transform: rotate(45deg);
}

.blob4 {
  bottom: 10%;
  right: 15%;
  width: 160px;
  transform: rotate(-60deg);
}

/* Navigation bar */
.nav-bar {
  background-color: #1e293b;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(255, 241, 230, 0.1);
  border-bottom: 1px solid rgba(255, 241, 230, 0.05);
  z-index: 1;
}

nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  font-weight: 600;
  color: #fff1e6;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #ffd6a5;
}

.sign-out-button {
  margin-left: auto;
  background-color: transparent;
  border: none;
  font-weight: 600;
  color: #fff1e6;
  cursor: pointer;
  transition: color 0.2s ease;
}

.sign-out-button:hover {
  color: #ff6b6b;
}
</style>
