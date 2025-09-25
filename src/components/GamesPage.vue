<template>
  <v-container class="py-6">
    <h2 class="mb-6">MilkSync Game Tracker</h2>

    <v-btn color="primary" @click="searchDialog = true">🔍 Search Games</v-btn>
    <v-btn color="secondary" class="ml-2" @click="editMode = !editMode">
      {{ editMode ? 'Exit Edit Mode' : 'Edit Games' }}
    </v-btn>

    <div v-if="editMode && selectedGames.length" class="my-4">
      <v-btn color="error" @click="bulkDelete">Delete Selected</v-btn>
      <div class="move-buttons">
        <v-btn color="success" @click="bulkMove('completed')">Move to Completed</v-btn>
        <v-btn color="info" @click="bulkMove('inProgress')">Move to In Progress</v-btn>
        <v-btn color="warning" @click="bulkMove('planned')">Move to Planned</v-btn>
      </div>
    </div>

    <!-- Search Dialog -->
<v-dialog v-model="searchDialog" max-width="1100px">
  <v-card>
    <v-card-title>
      <span class="text-h6">Search Games</span>
      <v-spacer />
      <v-btn icon @click="searchDialog = false"><v-icon>mdi-close</v-icon></v-btn>
    </v-card-title>

    <v-card-text style="max-height: 80vh; overflow-y: auto;">
      <v-text-field
        v-model="searchQuery"
        label="Search games"
        prepend-icon="mdi-magnify"
        @keyup.enter="searchGames"
        clearable
      />

      <div class="game-grid">
        <v-card
          v-for="game in searchResults"
          :key="game.id"
          class="game-card"
          :class="{ selected: selectedGames.includes(game.id) }"
          @click="toggleGameSelection(game)"
        >
          <v-img :src="game.background_image" height="240px" cover />
          <div class="game-title">{{ game.name || 'Untitled Game' }}</div>
        </v-card>
      </div>
    </v-card-text>

    <v-card-actions class="justify-space-between">
      <div>
        <v-btn color="success" @click="saveGameToCategory('completed')" :disabled="selectedGames.length === 0">Add to Completed</v-btn>
        <v-btn color="info" @click="saveGameToCategory('inProgress')" :disabled="selectedGames.length === 0">Add to In Progress</v-btn>
        <v-btn color="warning" @click="saveGameToCategory('planned')" :disabled="selectedGames.length === 0">Add to Planned</v-btn>
      </div>
      <v-spacer />
      <v-btn text @click="searchDialog = false">Done</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


    <!-- Player Selection Dialog -->
    <v-dialog v-model="playerDialog" max-width="500px">
      <v-card>
        <v-card-title>Select Players</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedPlayers"
            :items="allUsernames"
            item-title="username"
            item-value="id"
            label="Who will be playing?"
            multiple
            chips
          />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="confirmGameAssignment">Confirm</v-btn>
          <v-btn text @click="playerDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Game Info Dialog -->
    <v-dialog v-model="gameInfoDialog" max-width="600px">
      <v-card v-if="selectedGame">
        <v-img :src="selectedGame.background_image || selectedGame.image_url" height="240px" cover />
        <v-card-title>{{ selectedGame.name }}</v-card-title>
        <v-card-text>
          <p><strong>Platforms:</strong> {{ formatPlatforms(selectedGame.platforms) }}</p>
          <p><strong>Rating:</strong> {{ selectedGame.rating || 'Unrated' }}</p>
          <p><strong>Genre:</strong> {{ selectedGame.genres?.map(g => g.name).join(', ') || 'N/A' }}</p>
          <p><strong>Release Date:</strong> {{ selectedGame.released || 'Unknown' }}</p>
          <p><strong>Developer:</strong> {{ selectedGame.developers?.map(d => d.name).join(', ') || 'N/A' }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="gameInfoDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Game Sections -->
    <v-row>
      <GameSection
        title="✅ Completed"
        category="completed"
        :games="completedGames"
        :selectedGames="selectedGames"
        :editMode="editMode"
        @remove="deleteGame('completed', $event)"
        @move="moveGame"
        @info="editMode ? toggleGameSelection($event) : openGameInfo($event)"
        @editPlayers="openPlayerEditor"
      />
      <GameSection
        title="⏳ In Progress"
        category="inProgress"
        :games="inProgressGames"
        :selectedGames="selectedGames"
        :editMode="editMode"
        @remove="deleteGame('inProgress', $event)"
        @move="moveGame"
        @info="editMode ? toggleGameSelection($event) : openGameInfo($event)"
        @editPlayers="openPlayerEditor"
      />
      <GameSection
        title="📝 Planned"
        category="planned"
        :games="plannedGames"
        :selectedGames="selectedGames"
        :editMode="editMode"
        @remove="deleteGame('planned', $event)"
        @move="moveGame"
        @info="editMode ? toggleGameSelection($event) : openGameInfo($event)"
        @editPlayers="openPlayerEditor"
      />
    </v-row>

    <v-snackbar v-model="errorSnackbar" color="error">
      ❌ Something went wrong
    </v-snackbar>
  </v-container>
</template>




<script>
import { supabase } from '../supabase';
import GameSection from '../components/GameSection.vue';

export default {
  name: 'GamesPage',
  components: { GameSection },
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      selectedGames: [],
      completedGames: [],
      inProgressGames: [],
      plannedGames: [],
      searchDialog: false,
      gameInfoDialog: false,
      playerDialog: false,
      selectedGame: null,
      errorSnackbar: false,
      editMode: false,
      allUsernames: [],
      selectedPlayers: [],
      pendingCategory: '',
      editingGameId: null
    };
  },
  async mounted() {
    await this.fetchGames();

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url');

    if (error) {
      console.error('Failed to fetch usernames:', error.message);
    } else {
      this.allUsernames = users;
    }
  },
  methods: {
    async searchGames() {
      const apiKey = '243d6955b70b401092f7169e2badd60b';
      try {
        const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(this.searchQuery)}`);
        const data = await res.json();
        this.searchResults = data.results || [];
      } catch (err) {
        console.error('RAWG search error:', err);
        this.errorSnackbar = true;
      }
    },
    toggleGameSelection(game) {
      const index = this.selectedGames.indexOf(game.id);
      if (index === -1) {
        this.selectedGames.push(game.id);
      } else {
        this.selectedGames.splice(index, 1);
      }
    },
    async saveGameToCategory(category) {
      if (!this.selectedGames.length) return;
      this.pendingCategory = category;
      this.playerDialog = true;
    },
    openPlayerEditor(game) {
      this.editingGameId = game.id;
      this.selectedPlayers = Array.isArray(game.game_players)
        ? game.game_players.map(entry => entry.profile?.id).filter(Boolean)
        : [];
      this.playerDialog = true;
    },
    async confirmGameAssignment() {
      if (this.editingGameId) {
        await supabase
          .from('game_players')
          .delete()
          .eq('game_id', this.editingGameId);

        const updates = this.selectedPlayers.map(profile_id => ({
          game_id: this.editingGameId,
          profile_id
        }));

        const { error } = await supabase.from('game_players').insert(updates);
        if (error) {
          console.error('Player update error:', error.message);
          this.errorSnackbar = true;
        }

        this.editingGameId = null;
      } else {
        const selected = this.searchResults.filter(game =>
          this.selectedGames.includes(game.id)
        );

        for (const game of selected) {
          const { data: insertedGame, error: insertError } = await supabase
            .from('games')
            .insert({
              rawg_id: game.id,
              name: game.name,
              image_url: game.background_image || '',
              platforms: Array.isArray(game.platforms)
                ? game.platforms.map(p => p.platform.name)
                : [],
              category: this.pendingCategory
            })
            .select()
            .single();

          if (insertError) {
            console.error('Supabase insert error:', insertError.message);
            this.errorSnackbar = true;
            continue;
          }

          const assignments = this.selectedPlayers.map(profile_id => ({
            game_id: insertedGame.id,
            profile_id
          }));

          const { error: assignError } = await supabase
            .from('game_players')
            .insert(assignments);

          if (assignError) {
            console.error('Player assignment error:', assignError.message);
            this.errorSnackbar = true;
          }
        }
      }

      this.selectedGames = [];
      this.selectedPlayers = [];
      this.playerDialog = false;
      await this.fetchGames();
    },
    async fetchGames() {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          game_players (
            profile:profiles(id, username, avatar_url)
          )
        `);

      if (error) {
        console.error('Supabase fetch error:', error.message);
        this.errorSnackbar = true;
        return;
      }

      this.completedGames = data.filter(g => g.category === 'completed');
      this.inProgressGames = data.filter(g => g.category === 'inProgress');
      this.plannedGames = data.filter(g => g.category === 'planned');
    },
    async deleteGame(category, game) {
      if (!game?.id) {
        console.error('Delete failed: game object missing or invalid');
        this.errorSnackbar = true;
        return;
      }

      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id);

      if (error) {
        console.error('Supabase delete error:', error.message);
        this.errorSnackbar = true;
      } else {
        await this.fetchGames();
      }
    },
    async moveGame({ game, newCategory }) {
      const { error } = await supabase
        .from('games')
        .update({ category: newCategory })
        .eq('id', game.id);

      if (error) {
        console.error('Supabase move error:', error.message);
        this.errorSnackbar = true;
      } else {
        await this.fetchGames();
      }
    },
    async bulkDelete() {
      if (!confirm('Delete selected games?')) return;

      const { error } = await supabase
        .from('games')
        .delete()
        .in('id', this.selectedGames);

      if (error) {
        console.error('Bulk delete error:', error.message);
        this.errorSnackbar = true;
      } else {
        this.selectedGames = [];
        this.editMode = false;
        await this.fetchGames();
      }
    },
    async bulkMove(category) {
      const { error } = await supabase
        .from('games')
        .update({ category })
        .in('id', this.selectedGames);

      if (error) {
        console.error('Bulk move error:', error.message);
        this.errorSnackbar = true;
      } else {
        this.selectedGames = [];
        this.editMode = false;
        await this.fetchGames();
      }
    },
    async openGameInfo(game) {
      const apiKey = '243d6955b70b401092f7169e2badd60b';
      try {
        const res = await fetch(`https://api.rawg.io/api/games/${game.rawg_id || game.id}?key=${apiKey}`);
        const fullGame = await res.json();
        this.selectedGame = fullGame;
      } catch (err) {
        console.error('RAWG detail fetch error:', err);
        this.selectedGame = game;
      }
      this.gameInfoDialog = true;
    },
    formatPlatforms(platforms) {
      if (Array.isArray(platforms)) {
        return platforms.map(p => p.platform?.name || p).join(', ');
      }
      return platforms || 'N/A';
    }
  }
};
</script>






<style scoped>
.game-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
  padding: 12px 0;
}

.game-card {
  width: 160px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fffaf5;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
  cursor: pointer;
}

.game-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.game-card.selected {
  border-color: #1976d2;
  background-color: #f0f8ff;
  outline: 3px solid #90caf9;
  outline-offset: -2px;
}

.game-title {
  font-size: 0.85rem;
  text-align: center;
  padding: 8px;
  font-weight: 600;
  color: #5c3d2e;
  background-color: #fff0e6;
  border-top: 1px solid #eee;
  white-space: normal;
  word-break: break-word;
}

.move-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.v-select {
  margin-left: 12px;
}

.v-btn + .v-btn {
  margin-left: 8px;
}
</style>
