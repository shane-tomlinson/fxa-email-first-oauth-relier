<template>
  <div id="app">
    <img alt="Firefox logo" src="../public/firefox-logo.svg" id="firefox-logo">

    <FxAForm />
  </div>
</template>

<script>
import FxAForm from './components/FxAForm.vue'

export default {
  name: 'app',
  components: {
    FxAForm
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

#firefox-logo {
  width: 100px;
}
</style>
