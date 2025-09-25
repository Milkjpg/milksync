<template>
  <div class="avatar-editor">
    <v-file-input
      label="Choose Image"
      accept="image/*"
      @change="onFileChange"
      hide-details
      outlined
    />

    <div v-if="previewUrl" class="cropper-wrapper">
      <Cropper
        ref="cropper"
        :src="previewUrl"
        :stencil-props="{ aspectRatio: 1 }"
        :auto-zoom="false"
        :resize-image="true"
        :transformable="false"
        class="cropper"
      />
      <v-btn color="primary" class="mt-4" @click="uploadAvatar">
        Upload Avatar
      </v-btn>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabase';
import { uploadToSupabaseStorage } from '../utils/supabaseUpload';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

export default {
  name: 'AvatarEditor',
  components: { Cropper },
  props: ['userId'],
  data() {
    return {
      previewUrl: null,
      defaultAvatarUrl: ''
    };
  },
  async mounted() {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl('default-avatar.jpg');
    this.defaultAvatarUrl = data.publicUrl;
  },
  methods: {
    onFileChange(event) {
      const file = event?.target?.files?.[0];
      if (!file || !file.type?.startsWith('image/')) {
        console.error('Invalid file type:', file);
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    async uploadAvatar() {
      const canvas = this.$refs.cropper?.getResult()?.canvas;
      if (!canvas) {
        console.error('No canvas returned from cropper');
        return;
      }

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/png')
      );

      const fileName = `${this.userId}-${Date.now()}.png`;

      const publicUrl = await uploadToSupabaseStorage(blob, fileName);

      if (!publicUrl) {
        console.error('Upload failed or URL missing');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', this.userId);

      if (updateError) {
        console.error('Profile update failed:', updateError.message);
        return;
      }

      this.$emit('updated', publicUrl);
      this.previewUrl = null;
    }
  }
};
</script>


<style scoped>
.avatar-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cropper-wrapper {
  margin-top: 1rem;
  width: 100%;
  max-width: 300px;
}

.cropper {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
