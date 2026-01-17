<script setup lang="ts">
const { isLoggedIn, user, logout } = useAuth()

const items = [
  [{
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect: logout,
  }],
]
</script>

<template>
  <UButton
    v-if="!isLoggedIn"
    to="/auth/github"
    external
    icon="i-simple-icons-github"
    color="neutral"
    variant="ghost"
  >
    Login
  </UButton>

  <UDropdownMenu
    v-else
    :items="items"
  >
    <UButton
      color="neutral"
      variant="ghost"
    >
      <UAvatar
        :src="user?.avatarUrl"
        :alt="user?.username"
        size="xs"
      />
      <span class="ml-2 hidden sm:inline">{{ user?.username }}</span>
    </UButton>
  </UDropdownMenu>
</template>
