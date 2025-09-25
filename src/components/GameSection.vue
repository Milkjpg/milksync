<template>
  <v-col cols="12">
    <h3 class="mb-4">{{ title }}</h3>

    <div class="game-grid">
      <v-card
        v-for="game in games"
        :key="game.id || game.rawg_id"
        class="game-card"
        :class="{ selected: selectedGames.includes(game.id) }"
        @click="handleClick(game)"
      >
        <!-- Game Cover -->
        <v-img
          :src="game.image_url || game.background_image"
          height="240px"
          cover
          class="rounded-t-xl"
        />

        <!-- Game Title -->
        <div class="game-title">
          {{ game.name || 'Untitled Game' }}
        </div>

        <!-- Avatar Row -->
        <div class="avatar-row" v-if="getPlayerProfiles(game).length">
          <div
            v-for="player in getPlayerProfiles(game)"
            :key="player.id"
            class="avatar-wrapper"
            :title="player.username"
          >
            <img
              :src="player.avatar_url?.trim() || defaultAvatarUrl"
              :alt="player.username"
              class="avatar"
            />
          </div>
        </div>

        <!-- Meatball Menu -->
        <v-card-actions class="justify-center" v-if="!editMode">
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" class="menu-btn">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="option in moveOptions"
                :key="option"
                @click.stop="$emit('move', { game, newCategory: option })"
              >
                <v-list-item-title>Move to {{ formatLabel(option) }}</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item @click.stop="$emit('editPlayers', game)">
                <v-list-item-title>Edit Players</v-list-item-title>
              </v-list-item>
              <v-list-item @click.stop="$emit('remove', game)">
                <v-list-item-title class="text-error">Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-actions>
      </v-card>
    </div>
  </v-col>
</template>



<script>
import { supabase } from '../supabase';

export default {
  name: 'GameSection',
  props: {
    title: String,
    category: String,
    games: {
      type: Array,
      default: () => []
    },
    selectedGames: {
      type: Array,
      default: () => []
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      defaultAvatarUrl: ''
    };
  },
  computed: {
    moveOptions() {
      return ['completed', 'inProgress', 'planned'].filter(c => c !== this.category);
    }
  },
  async mounted() {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl('default-avatar.jpg');

    if (data?.publicUrl) {
      this.defaultAvatarUrl = data.publicUrl;
    } else {
      console.warn('⚠️ Default avatar URL not found in Supabase Storage');
    }
  },
  methods: {
    formatLabel(cat) {
      return {
        completed: '✅ Completed',
        inProgress: '⏳ In Progress',
        planned: '📝 Planned'
      }[cat] || cat;
    },
    handleClick(game) {
      this.$emit('info', game);
    },
    getPlayerProfiles(game) {
      return Array.isArray(game.game_players)
        ? game.game_players.map(entry => entry.profile).filter(Boolean)
        : [];
    }
  }
};
</script>


<style scoped>
.game-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  padding: 16px;
}

.game-card {
  width: 180px;
  min-height: 320px;
  background-color: #334155;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 2px solid transparent;
}

.game-card:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  border-color: #ffd9b3;
}

.game-card.selected {
  border-color: #ffcc99;
  background-color: #fff2e0;
  outline: 3px solid #ffe0b3;
  outline-offset: -2px;
}

.game-title {
  font-size: 0.9rem;
  text-align: center;
  padding: 8px;
  font-weight: 600;
  color: #5c3d2e;
  background-color: #fff0e6;
}

.avatar-row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.avatar-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f5e9dc;
  border: 2px solid #e0c4a8;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
</style>
