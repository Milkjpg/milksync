<template>
  <div class="filter-controls">
    <button @click="selectAll" class="toggle-btn">Select All</button>
    <button @click="clearAll" class="toggle-btn danger">Clear All</button>
  </div>

  <div class="filter">
    <label v-for="name in allNames" :key="name">
      <input
        type="checkbox"
        :value="name"
        v-model="visibleNames"
      />
      {{ name }}
    </label>
  </div>

  <div class="calendar">
    <h1>🗓️ Weekly Calendar</h1>
    <div class="grid">
      <!-- Top-left corner cell -->
      <div class="corner">Name</div>

      <!-- Day headers -->
      <div
        v-for="day in daysOfWeek"
        :key="day"
        class="header"
      >
        {{ day }}
      </div>

      <!-- Rows: one per person -->
      <div
        v-for="(row, rowIndex) in sheetData.filter(row => visibleNames.includes(row[0]))"
        :key="rowIndex"
        class="row"
      >
        <!-- Name cell -->
        <div class="name">{{ row[0] }}</div>

        <!-- Availability cells -->
        <div
          v-for="(cell, colIndex) in row.slice(1)"
          :key="colIndex"
          class="cell"
          :class="getCellClass(cell)"
        >
          {{ cell }}
        </div>
      </div>
    </div>
  </div>
</template>




<script>
import { supabase } from '../supabase';

export default {
  name: 'CalendarPage',
  data() {
    return {
      sheetData: [],
      daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      allNames: [],
      visibleNames: [],
      timeSlots: [],
      currentUserName: '',
      userTimeZone: ''
    };
  },
  methods: {
    getCellClass(content) {
      if (!content || content.toLowerCase().includes("tbd")) return "tbd";
      if (content.toLowerCase().includes("unavailable")) return "unavailable";
      return "available";
    },
    selectAll() {
      this.visibleNames = [...this.allNames];
    },
    clearAll() {
      this.visibleNames = [];
    },
    formatUtcToLocal(utcTime) {
      if (
        !utcTime ||
        typeof utcTime !== 'string' ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(utcTime)
      ) return "";

      const today = new Date().toISOString().split('T')[0];
      const date = new Date(`${today}T${utcTime}Z`);
      if (isNaN(date.getTime())) return "";

      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: this.userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    },
    generateTimeSlots() {
      const baseDate = new Date("2025-09-22T12:00:00-04:00");
      const slots = [];
      for (let hour = 12; hour <= 23; hour++) {
        const time = new Date(baseDate);
        time.setHours(hour, 0, 0, 0);
        slots.push(time.toISOString().replace("Z", "-04:00"));
      }
      this.timeSlots = slots;
    },
    async fetchAvailability() {
      const { data, error } = await supabase
        .from('availability')
        .select('*');

      if (error) {
        console.error("Supabase fetch error:", error);
        return;
      }

      this.sheetData = this.reshapeData(data);
      this.allNames = [...new Set(data.map(row => row.username))];
      this.visibleNames = [...this.allNames];
    },
    reshapeData(raw) {
      const grouped = {};
      raw.forEach(row => {
        if (!grouped[row.username]) {
          grouped[row.username] = { name: row.username };
        }

        const start = this.formatUtcToLocal(row.start_time);
        const end = this.formatUtcToLocal(row.end_time);

        let label;
        if (row.status === "Available") {
          label = start && end ? `${start}–${end}` : "TBD";
        } else {
          label = row.status;
        }

        grouped[row.username][row.day] = label;
      });

      return Object.values(grouped).map(person => {
        return [person.name, ...this.daysOfWeek.map(day => person[day] || "")];
      });
    },
    listenForUpdates() {
      supabase
        .channel('availability-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'availability' },
          payload => {
            console.log("Realtime update:", payload);
            this.fetchAvailability();
          }
        )
        .subscribe();
    },
    isEditable(name) {
      return name === this.currentUserName;
    },
    async updateAvailability(name, day, input) {
      let status = input;
      let start_time = null;
      let end_time = null;

      if (input.includes("–")) {
        [start_time, end_time] = input.split("–").map(t => t.trim());
        status = "Available";
      } else if (["TBD", "Unavailable"].includes(input)) {
        status = input;
      }

      const { data, error } = await supabase
        .from('availability')
        .upsert({
          username: name,
          day,
          start_time,
          end_time,
          status
        }, { onConflict: ['username', 'day'] });

      if (error) {
        console.error("Update failed:", error);
      } else {
        console.log("Availability updated:", data);
      }
    },
    async fetchUsername(userId) {
      const { data } = await supabase
        .from('profiles')
        .select('username, timezone')
        .eq('id', userId)
        .single();

      if (data) {
        this.currentUserName = data.username;
        this.userTimeZone = data.timezone;
      } else {
        console.warn("Username not found for user:", userId);
      }
    }
  },
  async mounted() {
    this.generateTimeSlots();
    this.fetchAvailability();
    this.listenForUpdates();

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.fetchUsername(user.id);
    }
  }
};
</script>




<style scoped>
.calendar {
  font-family: 'Quicksand', sans-serif;
  padding: 2rem;
  background-color: #0f172a;
  color: #fff1e6;
  text-align: center;
}

/* Grid Layout */
.grid {
  display: grid;
  grid-template-columns: 150px repeat(7, 1fr); /* 1 name column + 7 days */
  gap: 6px;
  margin-top: 1rem;
  background-color: #334155;
  border-radius: 16px;
  overflow: hidden;
}

/* Headers */
.corner,
.header {
  font-weight: 600;
  background-color: #334155;
  color: #ffd6a5;
  padding: 0.75rem;
  border: 1px solid rgba(255, 241, 230, 0.05);
  border-radius: 12px;
}

/* Rows */
.row {
  display: contents;
}

.name {
  font-weight: 600;
  background-color: #1e293b;
  color: #cdb4db;
  padding: 0.75rem;
  border-radius: 12px;
  text-align: left;
  border: 1px solid rgba(255, 241, 230, 0.05);
}

/* Cells */
.cell {
  padding: 0.75rem;
  border-radius: 12px;
  background-color: #1e293b;
  border: 1px solid rgba(255, 241, 230, 0.05);
  text-align: center;
  font-size: 0.85rem;
  color: #fff1e6;
}

/* Conditional classes */
.cell.unavailable {
  background-color: #3b1f1f;
  color: #ff6b6b;
  font-style: italic;
}

.cell.tbd {
  background-color: #5c4a2e;
  color: #ffd6a5;
  font-style: italic;
}

.cell.available {
  background-color: #a3c4f3;
  color: #121212;
  font-weight: 600;
}

/* Filter Controls */
.filter-controls {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.toggle-btn {
  background-color: #a3c4f3;
  color: #121212;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.toggle-btn:hover {
  background-color: #8bb3e8;
  transform: scale(1.05);
}

.toggle-btn.danger {
  background-color: #ff6b6b;
  color: #fff1e6;
}

.toggle-btn.danger:hover {
  background-color: #ff4c4c;
}

/* Filter Checkboxes */
.filter {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.filter label {
  background-color: #334155;
  color: #fff1e6;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.filter label:hover {
  background-color: #3f4e65;
}
</style>
