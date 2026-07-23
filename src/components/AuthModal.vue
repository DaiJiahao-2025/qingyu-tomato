<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'login' ? '登录账号' : '注册账号'"
    width="380px"
    append-to-body
    @closed="resetForm"
  >
    <div class="auth-form">
      <label class="field" for="authEmailInput">
        <span>邮箱</span>
        <ElInput
          id="authEmailInput"
          v-model="email"
          placeholder="you@example.com"
          autocomplete="email"
          :disabled="auth.authBusy"
        />
      </label>
      <label class="field" for="authPasswordInput">
        <span>密码</span>
        <ElInput
          id="authPasswordInput"
          v-model="password"
          type="password"
          show-password
          placeholder="至少 6 位"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          :disabled="auth.authBusy"
          @keyup.enter="submit"
        />
      </label>
      <label v-if="mode === 'register'" class="field" for="authNameInput">
        <span>昵称（可选）</span>
        <ElInput
          id="authNameInput"
          v-model="displayName"
          placeholder="怎么称呼你"
          maxlength="20"
          :disabled="auth.authBusy"
          @keyup.enter="submit"
        />
      </label>
      <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
      <p class="auth-hint">
        {{ mode === "login" ? "登录后本地进度会自动合并上云。" : "注册即可在多台设备间同步进度。" }}
      </p>
    </div>
    <template #footer>
      <div class="auth-footer">
        <ElButton text :disabled="auth.authBusy" @click="toggleMode">
          {{ mode === "login" ? "没有账号？去注册" : "已有账号？去登录" }}
        </ElButton>
        <ElButton type="primary" :loading="auth.authBusy" @click="submit">
          {{ mode === "login" ? "登录" : "注册" }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ElButton from "element-plus/es/components/button/index.mjs";
import ElDialog from "element-plus/es/components/dialog/index.mjs";
import ElInput from "element-plus/es/components/input/index.mjs";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/input/style/css";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const auth = useAuthStore();
const appStore = useAppStore();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const mode = ref<"login" | "register">("login");
const email = ref("");
const password = ref("");
const displayName = ref("");
const errorMessage = ref("");

function resetForm(): void {
  password.value = "";
  errorMessage.value = "";
}

function toggleMode(): void {
  mode.value = mode.value === "login" ? "register" : "login";
  errorMessage.value = "";
}

async function submit(): Promise<void> {
  errorMessage.value = "";
  if (!email.value.trim() || !password.value) {
    errorMessage.value = "请填写邮箱和密码。";
    return;
  }
  try {
    if (mode.value === "login") {
      await auth.login(email.value.trim(), password.value);
    } else {
      await auth.register(email.value.trim(), password.value, displayName.value.trim() || undefined);
    }
    visible.value = false;
    appStore.toast(mode.value === "login" ? "登录成功，进度已同步。" : "注册成功，本地进度已上云。");
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "操作失败，请稍后再试。";
  }
}
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-form .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-error {
  margin: 0;
  color: var(--el-color-danger, #c45656);
  font-size: 13px;
}

.auth-hint {
  margin: 0;
  color: var(--text-muted, #9b8f86);
  font-size: 12px;
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
